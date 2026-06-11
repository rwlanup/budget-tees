import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderStatus, PaymentStatus } from '../enums/order.enums';
import { Payment } from '../../payment/entities/payment.entity';
import { PaymentRecordStatus } from '../../payment/enums/payment.enums';
import { OrderStatusService } from './order-status.service';
import { InventoryService } from '../../sku/services/inventory.service';
import { CouponRedemptionService } from '../../coupon/coupon-redemption.service';
import { ListOrdersQueryDto, UpdateOrderStatusDto, FulfillmentDto } from '../dto/order-admin.dto';
import { paginate, PaginatedResult } from '../../../common/dto/pagination.dto';
import { emitEmail } from '../../../common/utils/emit-email';

const CANCELLABLE = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];
const STOCK_COMMITTED = [OrderStatus.CONFIRMED, OrderStatus.PROCESSING];

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    private readonly status: OrderStatusService,
    private readonly inventory: InventoryService,
    private readonly coupons: CouponRedemptionService,
    private readonly events: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  async findForUser(userId: string, query: ListOrdersQueryDto): Promise<PaginatedResult<Order>> {
    const [items, total] = await this.repo.findAndCount({
      where: { userId, ...(query.status ? { status: query.status } : {}) },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  async findOneForUser(userId: string, idOrNumber: string): Promise<Order> {
    const order = await this.repo.findOne({
      where: isUuid(idOrNumber) ? { id: idOrNumber, userId } : { orderNumber: idOrNumber, userId },
      relations: { payments: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    // Customer-facing: drop gateway internals before serializing.
    for (const p of order.payments ?? []) {
      p.gatewayResponse = null;
      p.gatewayTxnId = null;
      p.idempotencyKey = null;
    }
    order.payments = sortPaymentsDesc(order.payments);
    return order;
  }

  async adminList(query: ListOrdersQueryDto): Promise<PaginatedResult<Order>> {
    const [items, total] = await this.repo.findAndCount({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
        ...(query.fulfillmentMethod ? { fulfillmentMethod: query.fulfillmentMethod } : {}),
        ...(query.userId ? { userId: query.userId } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  async adminFindOne(id: string): Promise<Order> {
    const order = await this.repo.findOne({
      where: { id },
      relations: { payments: { refunds: true } },
    });
    if (!order) throw new NotFoundException('Order not found');
    order.payments = sortPaymentsDesc(order.payments);
    return order;
  }

  async cancel(userId: string, idOrNumber: string): Promise<Order> {
    const order = await this.findOneForUser(userId, idOrNumber);
    return this.doCancel(order, userId);
  }

  async adminUpdateStatus(id: string, dto: UpdateOrderStatusDto, adminId: string): Promise<Order> {
    const order = await this.adminFindOne(id);
    if (dto.status === OrderStatus.CANCELLED) return this.doCancel(order, adminId, dto.note);
    this.status.assertTransition(order.status, dto.status, order.fulfillmentMethod);
    const saved = await this.dataSource.transaction(async (mgr) => {
      order.status = dto.status;
      await mgr.getRepository(Order).save(order);
      await this.status.record(mgr, order.id, dto.status, dto.note, adminId);
      return order;
    });
    this.emitStatusUpdate(saved);
    return saved;
  }

  async adminFulfillment(id: string, dto: FulfillmentDto, adminId: string): Promise<Order> {
    const order = await this.adminFindOne(id);
    this.status.assertTransition(order.status, dto.status, order.fulfillmentMethod);
    const saved = await this.dataSource.transaction(async (mgr) => {
      order.status = dto.status;
      if (dto.trackingCarrier !== undefined) order.trackingCarrier = dto.trackingCarrier;
      if (dto.trackingNumber !== undefined) order.trackingNumber = dto.trackingNumber;
      await mgr.getRepository(Order).save(order);
      await this.status.record(mgr, order.id, dto.status, 'Fulfillment update', adminId);
      return order;
    });
    this.emitStatusUpdate(saved);
    return saved;
  }

  /**
   * Recompute the order's denormalized `paymentStatus` + `paidAt` from its payment rows
   * (the payments table is the single source of truth). Called after any payment mutation.
   */
  async recomputePaymentStatus(orderId: string, mgr?: EntityManager): Promise<void> {
    const repo = mgr ? mgr.getRepository(Order) : this.repo;
    const order = await repo.findOne({ where: { id: orderId }, relations: { payments: true } });
    if (!order) return;
    const { status, paidAt } = derivePaymentStatus(order.payments ?? []);
    await repo.update(orderId, { paymentStatus: status, paidAt });
  }

  // ---- hooks called by Payment / Returns ----

  /**
   * Payment captured. On the FIRST capture of a still-PENDING order, commit reserved
   * stock and advance PENDING → CONFIRMED; otherwise leave the order status untouched.
   * Payment status is always re-derived from the payments table.
   */
  async onPaymentSuccess(orderId: string): Promise<void> {
    const order = await this.dataSource.transaction(async (mgr) => {
      const order = await this.lock(mgr, orderId);
      let justConfirmed = false;
      if (order.status === OrderStatus.PENDING) {
        for (const item of order.items) {
          await this.inventory.commit(
            item.skuId,
            item.quantity,
            { refType: 'order', refId: orderId },
            mgr,
          );
        }
        order.status = OrderStatus.CONFIRMED;
        await mgr.getRepository(Order).save(order);
        await this.status.record(mgr, orderId, OrderStatus.CONFIRMED, 'Payment received');
        justConfirmed = true;
      }
      await this.recomputePaymentStatus(orderId, mgr);
      return justConfirmed ? order : null;
    });
    if (order) this.emitConfirmation(order);
  }

  /** Gateway verify failed: only a still-PENDING order is cancelled (release stock, reverse coupon). */
  async onPaymentFailure(orderId: string): Promise<void> {
    const order = await this.dataSource.transaction(async (mgr) => {
      const order = await this.lock(mgr, orderId);
      if (order.status !== OrderStatus.PENDING) {
        // Already confirmed/cancelled elsewhere — just refresh the payment projection.
        await this.recomputePaymentStatus(orderId, mgr);
        return null;
      }
      for (const item of order.items) {
        await this.inventory.release(
          item.skuId,
          item.quantity,
          { refType: 'order', refId: orderId },
          mgr,
        );
      }
      if (order.couponId) await this.coupons.reverse(orderId, mgr);
      order.status = OrderStatus.CANCELLED;
      await mgr.getRepository(Order).save(order);
      await this.status.record(mgr, orderId, OrderStatus.CANCELLED, 'Payment failed');
      await this.recomputePaymentStatus(orderId, mgr);
      return order;
    });
    if (order) this.emitStatusUpdate(order);
  }

  /** COD: confirm order and commit stock at placement (no online payment event). */
  async markCodConfirmed(orderId: string): Promise<void> {
    const order = await this.dataSource.transaction(async (mgr) => {
      const order = await this.lock(mgr, orderId);
      if (order.status !== OrderStatus.PENDING) return null;
      for (const item of order.items) {
        await this.inventory.commit(
          item.skuId,
          item.quantity,
          { refType: 'order', refId: orderId },
          mgr,
        );
      }
      order.status = OrderStatus.CONFIRMED;
      await mgr.getRepository(Order).save(order);
      await this.status.record(mgr, orderId, OrderStatus.CONFIRMED, 'COD order confirmed');
      await this.recomputePaymentStatus(orderId, mgr);
      return order;
    });
    if (order) this.emitConfirmation(order);
  }

  /**
   * Refund recorded on the payment ledger. Re-derive payment status from payments;
   * a full refund also moves the order to REFUNDED.
   */
  async markRefunded(orderId: string, full: boolean): Promise<void> {
    await this.recomputePaymentStatus(orderId);
    if (full) await this.repo.update(orderId, { status: OrderStatus.REFUNDED });
  }

  private async doCancel(order: Order, actorId: string, note?: string): Promise<Order> {
    if (!CANCELLABLE.includes(order.status)) {
      throw new ConflictException('Order can no longer be cancelled');
    }
    const cancelled = await this.dataSource.transaction(async (mgr) => {
      const locked = await this.lock(mgr, order.id);
      const committed = STOCK_COMMITTED.includes(locked.status);
      for (const item of locked.items) {
        if (committed) {
          await this.inventory.returnStock(
            item.skuId,
            item.quantity,
            { refType: 'order', refId: order.id },
            mgr,
          );
        } else {
          await this.inventory.release(
            item.skuId,
            item.quantity,
            { refType: 'order', refId: order.id },
            mgr,
          );
        }
      }
      if (locked.couponId) await this.coupons.reverse(order.id, mgr);
      locked.status = OrderStatus.CANCELLED;
      await mgr.getRepository(Order).save(locked);
      await this.status.record(mgr, order.id, OrderStatus.CANCELLED, note ?? 'Cancelled', actorId);
      return locked;
    });
    this.emitStatusUpdate(cancelled);
    return cancelled;
  }

  private emitConfirmation(order: Order): void {
    emitEmail(this.events, {
      template: 'ORDER_CONFIRMATION',
      to: order.contactEmail,
      data: { orderNumber: order.orderNumber, grandTotal: order.grandTotal },
      refType: 'order',
      refId: order.id,
      userId: order.userId,
    });
  }

  private emitStatusUpdate(order: Order): void {
    emitEmail(this.events, {
      template: 'ORDER_STATUS_UPDATE',
      to: order.contactEmail,
      data: { orderNumber: order.orderNumber, status: order.status },
      refType: 'order',
      refId: order.id,
      userId: order.userId,
    });
  }

  private async lock(mgr: EntityManager, orderId: string): Promise<Order> {
    // Lock the order row only (no eager join — FOR UPDATE can't span an outer join).
    const order = await mgr
      .getRepository(Order)
      .createQueryBuilder('o')
      .setLock('pessimistic_write')
      .where('o.id = :id', { id: orderId })
      .getOne();
    if (!order) throw new NotFoundException('Order not found');
    order.items = await mgr.getRepository(OrderItem).find({ where: { orderId } });
    return order;
  }
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Newest-first, non-mutating. */
function sortPaymentsDesc(payments: Payment[] = []): Payment[] {
  return [...payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Roll up an order's payment rows into the order-level PaymentStatus (the payments
 * table is authoritative). Precedence: REFUNDED > PARTIALLY_REFUNDED > PAID > FAILED > UNPAID.
 * `paidAt` is the most recent capture timestamp, if any.
 */
function derivePaymentStatus(payments: Payment[]): { status: PaymentStatus; paidAt: Date | null } {
  const has = (s: PaymentRecordStatus) => payments.some((p) => p.status === s);
  const captured = payments.filter(
    (p) =>
      p.status === PaymentRecordStatus.SUCCESS ||
      p.status === PaymentRecordStatus.PARTIALLY_REFUNDED ||
      p.status === PaymentRecordStatus.REFUNDED,
  );
  const paidAt = captured.reduce<Date | null>((acc, p) => {
    if (!p.paidAt) return acc;
    return !acc || p.paidAt > acc ? p.paidAt : acc;
  }, null);

  if (has(PaymentRecordStatus.REFUNDED)) return { status: PaymentStatus.REFUNDED, paidAt };
  if (has(PaymentRecordStatus.PARTIALLY_REFUNDED)) {
    return { status: PaymentStatus.PARTIALLY_REFUNDED, paidAt };
  }
  if (has(PaymentRecordStatus.SUCCESS)) return { status: PaymentStatus.PAID, paidAt };
  if (has(PaymentRecordStatus.FAILED)) return { status: PaymentStatus.FAILED, paidAt: null };
  return { status: PaymentStatus.UNPAID, paidAt: null };
}
