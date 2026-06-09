import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { FulfillmentMethod, OrderStatus, PaymentStatus } from '../enums/order.enums';
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
    });
    if (!order) throw new NotFoundException('Order not found');
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
    const order = await this.repo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
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

  // ---- hooks called by Payment / Returns ----

  async onPaymentSuccess(orderId: string): Promise<void> {
    const order = await this.dataSource.transaction(async (mgr) => {
      const order = await this.lock(mgr, orderId);
      if (order.paymentStatus === PaymentStatus.PAID) return null; // idempotent
      for (const item of order.items) {
        await this.inventory.commit(item.skuId, item.quantity, { refType: 'order', refId: orderId }, mgr);
      }
      order.paymentStatus = PaymentStatus.PAID;
      order.status = OrderStatus.CONFIRMED;
      order.paidAt = new Date();
      await mgr.getRepository(Order).save(order);
      await this.status.record(mgr, orderId, OrderStatus.CONFIRMED, 'Payment received');
      return order;
    });
    if (order) this.emitConfirmation(order);
  }

  async onPaymentFailure(orderId: string): Promise<void> {
    const order = await this.dataSource.transaction(async (mgr) => {
      const order = await this.lock(mgr, orderId);
      if (order.status === OrderStatus.CANCELLED) return null;
      for (const item of order.items) {
        await this.inventory.release(item.skuId, item.quantity, { refType: 'order', refId: orderId }, mgr);
      }
      if (order.couponId) await this.coupons.reverse(orderId, mgr);
      order.paymentStatus = PaymentStatus.FAILED;
      order.status = OrderStatus.CANCELLED;
      await mgr.getRepository(Order).save(order);
      await this.status.record(mgr, orderId, OrderStatus.CANCELLED, 'Payment failed');
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
        await this.inventory.commit(item.skuId, item.quantity, { refType: 'order', refId: orderId }, mgr);
      }
      order.status = OrderStatus.CONFIRMED;
      await mgr.getRepository(Order).save(order);
      await this.status.record(mgr, orderId, OrderStatus.CONFIRMED, 'COD order confirmed');
      return order;
    });
    if (order) this.emitConfirmation(order);
  }

  async markPaid(orderId: string): Promise<void> {
    await this.repo.update(orderId, { paymentStatus: PaymentStatus.PAID, paidAt: new Date() });
  }

  async markRefunded(orderId: string, full: boolean): Promise<void> {
    await this.repo.update(orderId, {
      paymentStatus: full ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
      ...(full ? { status: OrderStatus.REFUNDED } : {}),
    });
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
          await this.inventory.returnStock(item.skuId, item.quantity, { refType: 'order', refId: order.id }, mgr);
        } else {
          await this.inventory.release(item.skuId, item.quantity, { refType: 'order', refId: order.id }, mgr);
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
