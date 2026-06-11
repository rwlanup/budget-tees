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
import { OrderStatus, PaymentMethod, PaymentStatus } from '../order/enums/order.enums';
import { Order } from '../order/entities/order.entity';
import { OrderService } from '../order/services/order.service';
import { SettingsService } from '../settings/services/settings.service';
import { EsewaGateway } from './gateways/esewa.gateway';
import { GatewayStatusValue, PaymentGateway } from './gateways/payment-gateway.interface';
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
    private readonly events: EventEmitter2,
  ) {}

  private gateway(method: PaymentMethod): PaymentGateway {
    if (method === PaymentMethod.ESEWA) return this.esewa;
    throw new BadRequestException('No gateway for this method');
  }

  async initiate(userId: string, orderId: string, method: PaymentMethod, idempotencyKey?: string) {
    const order = await this.orders.findOneForUser(userId, orderId);

    // Replay: a retry that reuses the same key returns the original result — no duplicate
    // payment row. The eSewa form is rebuilt deterministically (no external side effect).
    if (idempotencyKey) {
      const existing = await this.repo.findOne({ where: { idempotencyKey } });
      if (existing) return this.buildInitiateResponse(order, existing);
    }

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
        idempotencyKey: idempotencyKey ?? null,
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
      return this.buildInitiateResponse(order, payment);
    }

    const init = await this.gateway(method).initiate(order, payment);
    payment.gatewayRef = init.gatewayRef; // eSewa transaction_uuid (= payment.id) — callback key
    payment.status = PaymentRecordStatus.PENDING;
    await this.repo.save(payment);
    return this.buildInitiateResponse(order, payment);
  }

  /** Build the POST /payments/initiate response from a payment row (also used for replays). */
  private async buildInitiateResponse(order: Order, payment: Payment) {
    if (payment.method === PaymentMethod.COD) {
      return { paymentId: payment.id, method: payment.method, status: 'PENDING', orderStatus: 'CONFIRMED' };
    }
    // ePay form is a pure local signing — safe to rebuild for an idempotent replay.
    const init = await this.gateway(payment.method).initiate(order, payment);
    return { paymentId: payment.id, gatewayRef: payment.gatewayRef ?? init.gatewayRef, redirect: init.redirect };
  }

  /**
   * eSewa redirect callback. Verify the signature on the decoded `data`, then settle the
   * payment by status. The controller redirects the browser to the result page afterward.
   */
  async handleCallback(payload: Record<string, unknown>) {
    const v = this.esewa.verifyCallback(payload);
    const payment = v.gatewayRef
      ? await this.repo.findOne({ where: { gatewayRef: v.gatewayRef } })
      : null;

    await this.eventRepo.save(
      this.eventRepo.create({
        paymentId: payment?.id ?? null,
        provider: 'esewa',
        type: `CALLBACK_${v.status}`,
        payload: v.raw as Record<string, unknown>,
        signatureValid: v.signatureValid,
      }),
    );

    if (!payment) throw new NotFoundException('Payment not found for reference');
    if (!v.signatureValid) throw new BadRequestException('Invalid callback signature');

    return this.applyStatus(payment, v.status, v.referenceCode, v.raw);
  }

  /**
   * Active status check (eSewa ePay status API) for an order's latest online payment.
   * Used by the result page / order detail to settle while the async callback is in flight.
   * Ownership-checked. Returns the order's current (derived) payment status.
   */
  async reconcileOrderPayment(userId: string, idOrNumber: string) {
    const order = await this.orders.findOneForUser(userId, idOrNumber);
    const payment = await this.repo.findOne({
      where: { orderId: order.id, method: PaymentMethod.ESEWA },
      order: { createdAt: 'DESC' },
    });

    if (payment && !this.isTerminal(payment.status)) {
      // ePay status check keys: transaction_uuid (= payment.id) + total_amount.
      const result = await this.esewa.checkStatus(payment.id, payment.amount);
      await this.eventRepo.save(
        this.eventRepo.create({
          paymentId: payment.id,
          provider: 'esewa',
          type: `STATUS_${result.status}`,
          payload: result.raw as Record<string, unknown>,
          signatureValid: true,
        }),
      );
      await this.applyStatus(payment, result.status, result.referenceCode, result.raw);
    }

    const fresh = await this.orders.findOneForUser(userId, idOrNumber);
    return { orderNumber: fresh.orderNumber, paymentStatus: fresh.paymentStatus };
  }

  private isTerminal(status: PaymentRecordStatus): boolean {
    return (
      status === PaymentRecordStatus.SUCCESS ||
      status === PaymentRecordStatus.FAILED ||
      status === PaymentRecordStatus.REFUNDED ||
      status === PaymentRecordStatus.PARTIALLY_REFUNDED
    );
  }

  /** Apply a normalized gateway status to a payment + drive order hooks. Idempotent. */
  private async applyStatus(
    payment: Payment,
    status: GatewayStatusValue,
    referenceCode: string | undefined,
    raw: unknown,
  ) {
    const order = await this.orders.adminFindOne(payment.orderId).catch(() => null);
    const orderNumber = order?.orderNumber ?? null;

    payment.gatewayResponse = {
      ...(payment.gatewayResponse ?? {}),
      lastStatus: raw,
    } as Record<string, unknown>;

    if (status === 'SUCCESS') {
      if (payment.status !== PaymentRecordStatus.SUCCESS) {
        payment.status = PaymentRecordStatus.SUCCESS;
        payment.paidAt = new Date();
        if (referenceCode) payment.gatewayTxnId = referenceCode;
        await this.repo.save(payment);
        await this.orders.onPaymentSuccess(payment.orderId);
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
      }
      return { status: 'SUCCESS', success: true, orderNumber };
    }

    if (status === 'FAILED' || status === 'CANCELED') {
      if (!this.isTerminal(payment.status)) {
        payment.status = PaymentRecordStatus.FAILED;
        payment.failedAt = new Date();
        await this.repo.save(payment);
        await this.orders.onPaymentFailure(payment.orderId);
      }
      return { status: 'FAILED', success: false, orderNumber };
    }

    if (status === 'REVERTED') {
      if (payment.status !== PaymentRecordStatus.REFUNDED) {
        payment.status = PaymentRecordStatus.REFUNDED;
        await this.repo.save(payment);
        await this.orders.markRefunded(payment.orderId, true);
      }
      return { status: 'REFUNDED', success: false, orderNumber };
    }

    // BOOKED / PENDING / UNKNOWN — still settling.
    await this.repo.save(payment);
    return { status: 'PENDING', success: false, orderNumber };
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
      relations: ['order'],
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

  /**
   * Admin records an order as paid (COD cash collected, or an offline transfer).
   * Settles the latest payment row to SUCCESS (creating one if none exists) — the payments
   * table is the source of truth — then refreshes the order: a still-PENDING order is
   * confirmed and its reserved stock committed; any later status is left unchanged.
   */
  async markOrderPaid(orderId: string): Promise<void> {
    const order = await this.orders.adminFindOne(orderId);
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException('Order is already paid');
    }
    if (
      order.paymentStatus === PaymentStatus.REFUNDED ||
      order.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new ConflictException('Refunded orders cannot be marked paid');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new ConflictException('Cancelled orders cannot be marked paid');
    }

    let payment = await this.repo.findOne({ where: { orderId }, order: { createdAt: 'DESC' } });
    if (!payment) {
      payment = this.repo.create({
        orderId,
        method: order.paymentMethod,
        amount: order.grandTotal,
        currency: order.currency,
        status: PaymentRecordStatus.INITIATED,
        initiatedAt: new Date(),
      });
    }
    payment.status = PaymentRecordStatus.SUCCESS;
    payment.paidAt = new Date();
    await this.repo.save(payment);

    await this.orders.onPaymentSuccess(orderId);
  }
}
