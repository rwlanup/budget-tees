import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentRefund } from './entities/payment-refund.entity';
import { PaymentRecordStatus } from './enums/payment.enums';
import { OrderService } from '../order/services/order.service';
import { RefundDto } from './dto/payment.dto';
import { addMoney, round2 } from '../../common/utils/money';
import { emitEmail } from '../../common/utils/emit-email';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(PaymentRefund) private readonly refundRepo: Repository<PaymentRefund>,
    private readonly orders: OrderService,
    private readonly events: EventEmitter2,
  ) {}

  /** Record a manual (out-of-band) refund and update payment + order status. */
  async refund(paymentId: string, dto: RefundDto, adminId: string): Promise<PaymentRefund> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (
      payment.status !== PaymentRecordStatus.SUCCESS &&
      payment.status !== PaymentRecordStatus.PARTIALLY_REFUNDED
    ) {
      throw new BadRequestException('Only captured payments can be refunded');
    }

    const prior = await this.refundRepo.find({ where: { paymentId } });
    const refunded = addMoney(...prior.map((r) => r.amount));
    const refundable = round2(payment.amount - refunded);
    if (dto.amount > refundable) {
      throw new BadRequestException(`Refund exceeds refundable amount (${refundable})`);
    }

    const record = await this.refundRepo.save(
      this.refundRepo.create({
        paymentId,
        amount: dto.amount,
        reason: dto.reason,
        externalRef: dto.externalRef ?? null,
        createdBy: adminId,
      }),
    );

    const totalRefunded = addMoney(refunded, dto.amount);
    const full = totalRefunded >= payment.amount;
    payment.status = full ? PaymentRecordStatus.REFUNDED : PaymentRecordStatus.PARTIALLY_REFUNDED;
    await this.paymentRepo.save(payment);
    await this.orders.markRefunded(payment.orderId, full);

    const order = await this.orders.adminFindOne(payment.orderId).catch(() => null);
    if (order) {
      emitEmail(this.events, {
        template: 'REFUND_PROCESSED',
        to: order.contactEmail,
        data: { orderNumber: order.orderNumber, amount: dto.amount },
        refType: 'order',
        refId: order.id,
        userId: order.userId,
      });
    }

    return record;
  }
}
