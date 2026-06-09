import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { FulfillmentMethod, OrderStatus } from '../enums/order.enums';
import { OrderStatusHistory } from '../entities/order-status-history.entity';

/** Allowed admin-driven transitions (payment/return flows set REFUNDED/RETURNED directly). */
const COMMON: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
};

const DELIVERY: Partial<Record<OrderStatus, OrderStatus[]>> = {
  ...COMMON,
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
};

const PICKUP: Partial<Record<OrderStatus, OrderStatus[]>> = {
  ...COMMON,
  [OrderStatus.PROCESSING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.PICKED_UP],
};

@Injectable()
export class OrderStatusService {
  assertTransition(from: OrderStatus, to: OrderStatus, method: FulfillmentMethod): void {
    const map = method === FulfillmentMethod.PICKUP ? PICKUP : DELIVERY;
    const allowed = map[from] ?? [];
    if (!allowed.includes(to)) {
      throw new ConflictException(`Illegal status transition ${from} -> ${to}`);
    }
  }

  record(
    mgr: EntityManager,
    orderId: string,
    status: OrderStatus,
    note?: string,
    changedBy?: string,
  ): Promise<OrderStatusHistory> {
    return mgr.getRepository(OrderStatusHistory).save(
      mgr.getRepository(OrderStatusHistory).create({
        orderId,
        status,
        note: note ?? null,
        changedBy: changedBy ?? null,
      }),
    );
  }
}
