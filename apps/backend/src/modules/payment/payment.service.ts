import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { emitEmail } from '../../common/utils/emit-email';
import { Payment } from './entities/payment.entity';
import { PaymentEvent } from './entities/payment-event.entity';
import { PaymentRecordStatus } from './enums/payment.enums';
import { PaymentMethod, PaymentStatus } from '../order/enums/order.enums';
import { OrderService } from '../order/services/order.service';
import { SettingsService } from '../settings/services/settings.service';
import { EsewaGateway } from './gateways/esewa.gateway';
import { KhaltiGateway } from './gateways/khalti.gateway';
import { PaymentGateway } from './gateways/payment-gateway.interface';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    @InjectRepository(PaymentEvent) private readonly eventRepo: Repository<PaymentEvent>,
    private readonly orders: OrderService,
    private readonly settings: SettingsService,
    private readonly esewa: EsewaGateway,
    private readonly khalti: KhaltiGateway,
    private readonly events: EventEmitter2,
  ) {}

  private gateway(method: PaymentMethod): PaymentGateway {
    if (method === PaymentMethod.ESEWA) return this.esewa;
    if (method === PaymentMethod.KHALTI) return this.khalti;
    throw new BadRequestException('No gateway for this method');
  }

  async initiate(userId: string, orderId: string, method: PaymentMethod) {
    const order = await this.orders.findOneForUser(userId, orderId);
    if (order.paymentStatus !== PaymentStatus.UNPAID) {
      throw new ConflictException('Order is not awaiting payment');
    }

    const payment = await this.repo.save(
      this.repo.create({
        orderId,
        method,
        amount: order.grandTotal,
        currency: order.currency,
        status: PaymentRecordStatus.INITIATED,
        initiatedAt: new Date(),
      }),
    );

    if (method === PaymentMethod.COD) {
      const cap = await this.settings.getCodCap();
      if (order.grandTotal > cap) {
        throw new BadRequestException(`COD not available for orders above ${cap}`);
      }
      payment.status = PaymentRecordStatus.PENDING;
      await this.repo.save(payment);
      await this.orders.markCodConfirmed(orderId);
      return { paymentId: payment.id, method, status: 'PENDING', orderStatus: 'CONFIRMED' };
    }

    const init = await this.gateway(method).initiate(order, payment);
    payment.gatewayRef = init.gatewayRef;
    payment.status = PaymentRecordStatus.PENDING;
    await this.repo.save(payment);
    return { paymentId: payment.id, gatewayRef: init.gatewayRef, redirect: init.redirect };
  }

  async handleCallback(provider: 'esewa' | 'khalti', payload: Record<string, unknown>) {
    const gateway = provider === 'esewa' ? this.esewa : this.khalti;
    const verification = await gateway.verify(payload);
    const payment = await this.repo.findOne({ where: { gatewayRef: verification.gatewayRef } });

    await this.eventRepo.save(
      this.eventRepo.create({
        paymentId: payment?.id ?? null,
        provider,
        type: verification.success ? 'VERIFIED_SUCCESS' : 'VERIFIED_FAILURE',
        payload: verification.raw as Record<string, unknown>,
        signatureValid: !!payment,
      }),
    );

    if (!payment) throw new NotFoundException('Payment not found for reference');
    if (payment.status === PaymentRecordStatus.SUCCESS) {
      return { status: 'SUCCESS', idempotent: true }; // duplicate callback
    }

    payment.gatewayResponse = verification.raw as Record<string, unknown>;
    payment.gatewayTxnId = verification.gatewayTxnId ?? null;

    if (verification.success) {
      payment.status = PaymentRecordStatus.SUCCESS;
      payment.paidAt = new Date();
      await this.repo.save(payment);
      await this.orders.onPaymentSuccess(payment.orderId);
      const order = await this.orders.adminFindOne(payment.orderId).catch(() => null);
      if (order) {
        emitEmail(this.events, {
          template: 'PAYMENT_RECEIPT',
          to: order.contactEmail,
          data: { orderNumber: order.orderNumber, amount: payment.amount },
          refType: 'order',
          refId: order.id,
          userId: order.userId,
        });
      }
      return { status: 'SUCCESS' };
    }
    payment.status = PaymentRecordStatus.FAILED;
    payment.failedAt = new Date();
    await this.repo.save(payment);
    await this.orders.onPaymentFailure(payment.orderId);
    return { status: 'FAILED' };
  }

  async statusForUser(userId: string, paymentId: string): Promise<Payment> {
    const payment = await this.repo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    await this.orders.findOneForUser(userId, payment.orderId); // ownership check
    return payment;
  }

  async adminList(query: PaginationQueryDto): Promise<PaginatedResult<Payment>> {
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  findById(id: string): Promise<Payment | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Latest captured payment for an order (for refunds via Returns). */
  findCapturedByOrder(orderId: string): Promise<Payment | null> {
    return this.repo.findOne({
      where: [
        { orderId, status: PaymentRecordStatus.SUCCESS },
        { orderId, status: PaymentRecordStatus.PARTIALLY_REFUNDED },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /** COD settlement on delivery/pickup (admin). */
  async markCodPaid(orderId: string): Promise<void> {
    const payment = await this.repo.findOne({ where: { orderId, method: PaymentMethod.COD } });
    if (payment) {
      payment.status = PaymentRecordStatus.SUCCESS;
      payment.paidAt = new Date();
      await this.repo.save(payment);
    }
    await this.orders.markPaid(orderId);
  }
}
