import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, Repository } from 'typeorm';
import { emitEmail } from '../../common/utils/emit-email';
import { isUuid } from '../../common/utils/uuid';
import { emitNotification } from '../notification/notification-event';
import { NotificationActorType, NotificationType } from '../notification/enums/notification.enums';
import { ReturnRequest } from './entities/return-request.entity';
import { ReturnItem } from './entities/return-item.entity';
import { ResolutionType, ReturnStatus } from './enums/return.enums';
import { OrderService } from '../order/services/order.service';
import { OrderStatus, PaymentStatus } from '../order/enums/order.enums';
import { SkuService } from '../sku/services/sku.service';
import { SkuSnapshot } from '../sku/entities/sku.entity';
import { InventoryService } from '../sku/services/inventory.service';
import { PaymentService } from '../payment/payment.service';
import { RefundService } from '../payment/refund.service';
import { SettingsService } from '../settings/services/settings.service';
import {
  CreateReturnDto,
  ListReturnsQueryDto,
  ReceiveReturnDto,
  ResolveReturnDto,
  ReviewReturnDto,
} from './dto/return.dto';
import { addMoney, round2 } from '../../common/utils/money';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

const RETURNABLE_STATUSES = [OrderStatus.DELIVERED, OrderStatus.PICKED_UP];

@Injectable()
export class ReturnService {
  constructor(
    @InjectRepository(ReturnRequest) private readonly reqRepo: Repository<ReturnRequest>,
    @InjectRepository(ReturnItem) private readonly itemRepo: Repository<ReturnItem>,
    private readonly orders: OrderService,
    private readonly skus: SkuService,
    private readonly inventory: InventoryService,
    private readonly payments: PaymentService,
    private readonly refunds: RefundService,
    private readonly settings: SettingsService,
    private readonly events: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  private async emitUpdate(req: ReturnRequest, actorId?: string): Promise<void> {
    const order = await this.orders.adminFindOne(req.orderId).catch(() => null);
    if (!order) return;
    emitEmail(this.events, {
      template: 'RETURN_UPDATE',
      to: order.contactEmail,
      data: { returnNumber: req.returnNumber, status: req.status },
      refType: 'return',
      refId: req.id,
      userId: req.userId,
    });
    // Admin advanced the return → notify the customer (the acting admin is suppressed).
    emitNotification(this.events, {
      type: NotificationType.RETURN_STATUS_UPDATED,
      actorId: actorId ?? null,
      actorType: actorId ? NotificationActorType.ADMIN : NotificationActorType.SYSTEM,
      return: {
        id: req.id,
        returnNumber: req.returnNumber,
        userId: req.userId,
        status: req.status,
        orderNumber: order.orderNumber,
      },
    });
  }

  async create(userId: string, orderId: string, dto: CreateReturnDto): Promise<ReturnRequest> {
    const order = await this.orders.findOneForUser(userId, orderId);
    if (!RETURNABLE_STATUSES.includes(order.status)) {
      throw new UnprocessableEntityException('Order is not eligible for returns');
    }
    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new UnprocessableEntityException('Order is not paid');
    }
    const windowDays = await this.settings.getReturnWindowDays();
    const deliveredAt = order.updatedAt.getTime();
    if (Date.now() > deliveredAt + windowDays * 86400_000) {
      throw new UnprocessableEntityException('Return window has expired');
    }

    const items: Partial<ReturnItem>[] = [];
    let refundTotal = 0;
    let priceDifference = 0;
    const returnedMap = await this.alreadyReturnedMany(dto.items.map((i) => i.orderItemId));
    for (const input of dto.items) {
      const orderItem = order.items.find((i) => i.id === input.orderItemId);
      if (!orderItem) throw new UnprocessableEntityException('Order item not found in this order');
      const returnable = orderItem.quantity - (returnedMap.get(input.orderItemId) ?? 0);
      if (input.quantity > returnable) {
        throw new UnprocessableEntityException(
          `Only ${returnable} of ${orderItem.productName} can be returned`,
        );
      }
      const lineRefund = round2((orderItem.lineTotal * input.quantity) / orderItem.quantity);
      refundTotal = addMoney(refundTotal, lineRefund);

      let exchangeSku: SkuSnapshot | null = null;
      if (dto.resolutionType === ResolutionType.EXCHANGE) {
        if (!input.exchangeSkuId)
          throw new BadRequestException('exchangeSkuId required for exchange');
        const exSku = await this.skus.findOne(input.exchangeSkuId);
        if (!exSku.isActive) throw new ConflictException('Exchange SKU is unavailable');
        priceDifference = addMoney(
          priceDifference,
          round2((exSku.price - orderItem.unitPrice) * input.quantity),
        );
        // Freeze the replacement variant's details so they survive later catalog changes.
        exchangeSku = await this.skus.snapshot(input.exchangeSkuId);
      }
      items.push({
        orderItemId: input.orderItemId,
        skuId: orderItem.skuId,
        quantity: input.quantity,
        exchangeSkuId: input.exchangeSkuId ?? null,
        exchangeSku,
        lineRefundAmount: lineRefund,
      });
    }

    const seq = await this.dataSource.query(`SELECT nextval('return_number_seq') AS n`);
    const returnNumber = `RET-${new Date().getFullYear()}-${String(seq[0].n).padStart(6, '0')}`;

    const request = await this.reqRepo.save(
      this.reqRepo.create({
        returnNumber,
        orderId,
        userId,
        resolutionType: dto.resolutionType,
        status: ReturnStatus.REQUESTED,
        reason: dto.reason,
        customerNote: dto.customerNote ?? null,
        refundAmount: dto.resolutionType === ResolutionType.REFUND ? refundTotal : null,
        priceDifference: dto.resolutionType === ResolutionType.EXCHANGE ? priceDifference : null,
        items: items as ReturnItem[],
      }),
    );
    // Notify admins of the new return (the requesting customer is not self-notified).
    emitNotification(this.events, {
      type: NotificationType.RETURN_CREATED,
      actorId: userId,
      actorType: NotificationActorType.CUSTOMER,
      return: { id: request.id, returnNumber: request.returnNumber, userId },
    });
    return this.findOne(request.id);
  }

  listForUser(userId: string, query: ListReturnsQueryDto): Promise<PaginatedResult<ReturnRequest>> {
    return this.list(query, userId);
  }

  async adminList(query: ListReturnsQueryDto): Promise<PaginatedResult<ReturnRequest>> {
    return this.list(query);
  }

  private async list(
    query: ListReturnsQueryDto,
    userId?: string,
  ): Promise<PaginatedResult<ReturnRequest>> {
    const [items, total] = await this.reqRepo.findAndCount({
      where: {
        ...(userId ? { userId } : {}),
        ...(query.status ? { status: query.status as ReturnStatus } : {}),
      },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<ReturnRequest> {
    const req = await this.reqRepo.findOne({
      where: isUuid(id) ? { id } : { returnNumber: id },
    });
    if (!req) throw new NotFoundException('Return not found');
    return req;
  }

  async cancel(userId: string, id: string): Promise<ReturnRequest> {
    const req = await this.findOne(id);
    if (req.userId !== userId) throw new NotFoundException('Return not found');
    if (req.status !== ReturnStatus.REQUESTED) {
      throw new ConflictException('Only requested returns can be cancelled');
    }
    req.status = ReturnStatus.CANCELLED;
    const saved = await this.reqRepo.save(req);
    // Notify admins of the cancellation (the customer who cancelled is not self-notified).
    emitNotification(this.events, {
      type: NotificationType.RETURN_CANCELLED,
      actorId: userId,
      actorType: NotificationActorType.CUSTOMER,
      return: { id: saved.id, returnNumber: saved.returnNumber, userId: saved.userId },
    });
    return saved;
  }

  async review(id: string, dto: ReviewReturnDto, adminId: string): Promise<ReturnRequest> {
    const req = await this.findOne(id);
    if (req.status !== ReturnStatus.REQUESTED)
      throw new ConflictException('Return already reviewed');
    req.status = dto.decision === 'APPROVE' ? ReturnStatus.AWAITING_ITEMS : ReturnStatus.REJECTED;
    req.adminNote = dto.adminNote ?? null;
    req.processedBy = adminId;
    const saved = await this.reqRepo.save(req);
    await this.emitUpdate(saved, adminId);
    return saved;
  }

  async receive(id: string, dto: ReceiveReturnDto, adminId: string): Promise<ReturnRequest> {
    const req = await this.findOne(id);
    if (req.status !== ReturnStatus.AWAITING_ITEMS) {
      throw new ConflictException('Return is not awaiting items');
    }
    for (const r of dto.items) {
      const item = req.items.find((i) => i.id === r.returnItemId);
      if (!item) continue;
      item.conditionOnReceipt = r.conditionOnReceipt;
      item.restock = r.restock;
      await this.itemRepo.save(item);
    }
    req.status = ReturnStatus.RECEIVED;
    req.processedBy = adminId;
    const saved = await this.reqRepo.save(req);
    await this.emitUpdate(saved, adminId);
    return saved;
  }

  async resolve(id: string, dto: ResolveReturnDto, adminId: string): Promise<ReturnRequest> {
    const req = await this.findOne(id);
    if (req.status !== ReturnStatus.RECEIVED) {
      throw new ConflictException('Return must be received before resolving');
    }

    // Restock sellable items.
    await this.dataSource.transaction(async (mgr) => {
      for (const item of req.items) {
        if (item.restock) {
          await this.inventory.returnStock(
            item.skuId,
            item.quantity,
            { refType: 'return', refId: req.id, reason: req.returnNumber },
            mgr,
          );
        }
        if (req.resolutionType === ResolutionType.EXCHANGE && item.exchangeSkuId) {
          await this.inventory.reserve(
            item.exchangeSkuId,
            item.quantity,
            { refType: 'exchange', refId: req.id },
            mgr,
          );
          await this.inventory.commit(
            item.exchangeSkuId,
            item.quantity,
            { refType: 'exchange', refId: req.id },
            mgr,
          );
        }
      }
    });

    if (req.resolutionType === ResolutionType.REFUND) {
      const amount = dto.refundAmount ?? req.refundAmount ?? 0;
      const payment = await this.payments.findCapturedByOrder(req.orderId);
      if (payment && amount > 0) {
        await this.refunds.refund(
          payment.id,
          { amount, reason: `Return ${req.returnNumber}`, externalRef: dto.externalRef },
          adminId,
        );
      } else {
        // COD / no captured payment — record order-level refund status directly.
        await this.orders.markRefunded(req.orderId, await this.isFullReturn(req.orderId));
      }
    }

    req.status = ReturnStatus.COMPLETED;
    req.resolvedAt = new Date();
    req.processedBy = adminId;
    const saved = await this.reqRepo.save(req);
    await this.emitUpdate(saved, adminId);
    return saved;
  }

  /** Per-line remaining returnable quantity for an order. */
  async returnable(userId: string, orderId: string) {
    const order = await this.orders.findOneForUser(userId, orderId);
    const eligible =
      RETURNABLE_STATUSES.includes(order.status) && order.paymentStatus === PaymentStatus.PAID;
    const returnedMap = await this.alreadyReturnedMany(order.items.map((i) => i.id));
    const items = order.items.map((item) => {
      const returned = returnedMap.get(item.id) ?? 0;
      return {
        orderItemId: item.id,
        productName: item.productName,
        ordered: item.quantity,
        returned,
        returnable: item.quantity - returned,
      };
    });
    return { eligible, items };
  }

  /** Sum of returned (non-rejected/cancelled) quantity per order item, in one query. */
  private async alreadyReturnedMany(orderItemIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!orderItemIds.length) return map;
    const rows: Array<{ orderItemId: string; n: number }> = await this.dataSource.query(
      `SELECT ri."orderItemId" AS "orderItemId", COALESCE(SUM(ri.quantity),0)::int AS n
       FROM return_items ri JOIN return_requests rr ON rr.id = ri."returnRequestId"
       WHERE ri."orderItemId" = ANY($1) AND rr.status NOT IN ('REJECTED','CANCELLED')
       GROUP BY ri."orderItemId"`,
      [orderItemIds],
    );
    for (const r of rows) map.set(r.orderItemId, r.n);
    return map;
  }

  private async isFullReturn(orderId: string): Promise<boolean> {
    const order = await this.orders.adminFindOne(orderId);
    const returnedMap = await this.alreadyReturnedMany(order.items.map((i) => i.id));
    return order.items.every((item) => (returnedMap.get(item.id) ?? 0) >= item.quantity);
  }
}
