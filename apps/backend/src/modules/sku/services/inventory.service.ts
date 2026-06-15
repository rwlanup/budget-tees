import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Sku } from '../entities/sku.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { StockMovementType } from '../enums/stock-movement-type.enum';
import { emitNotification } from '../../notification/notification-event';
import {
  NotificationActorType,
  NotificationType,
} from '../../notification/enums/notification.enums';

export interface MovementRef {
  refType?: string;
  refId?: string;
  createdBy?: string;
  reason?: string;
}

/**
 * Concurrency-safe inventory operations. Every mutation locks the SKU row
 * (pessimistic_write) and writes a stock_movement. Methods accept an optional
 * EntityManager so callers (Order checkout) can run them inside their own txn.
 */
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Sku) private readonly skuRepo: Repository<Sku>,
    private readonly dataSource: DataSource,
    private readonly events: EventEmitter2,
  ) {}

  reserve(skuId: string, qty: number, ref: MovementRef = {}, mgr?: EntityManager) {
    return this.run(mgr, async (m) => {
      const sku = await this.lock(m, skuId);
      const available = sku.stock - sku.reserved;
      if (!sku.allowBackorder && available < qty) {
        throw new ConflictException({
          code: 'INSUFFICIENT_STOCK',
          message: `SKU ${sku.sku} out of stock`,
        });
      }
      sku.reserved += qty;
      await m.getRepository(Sku).save(sku);
      await this.movement(m, skuId, StockMovementType.RESERVE, qty, ref);
      return sku;
    });
  }

  commit(skuId: string, qty: number, ref: MovementRef = {}, mgr?: EntityManager) {
    return this.run(mgr, async (m) => {
      const sku = await this.lock(m, skuId);
      sku.stock = Math.max(0, sku.stock - qty);
      sku.reserved = Math.max(0, sku.reserved - qty);
      await m.getRepository(Sku).save(sku);
      await this.movement(m, skuId, StockMovementType.COMMIT, -qty, ref);
      return sku;
    });
  }

  release(skuId: string, qty: number, ref: MovementRef = {}, mgr?: EntityManager) {
    return this.run(mgr, async (m) => {
      const sku = await this.lock(m, skuId);
      sku.reserved = Math.max(0, sku.reserved - qty);
      await m.getRepository(Sku).save(sku);
      await this.movement(m, skuId, StockMovementType.RELEASE, -qty, ref);
      return sku;
    });
  }

  returnStock(skuId: string, qty: number, ref: MovementRef = {}, mgr?: EntityManager) {
    return this.run(mgr, async (m) => {
      const sku = await this.lock(m, skuId);
      sku.stock += qty;
      await m.getRepository(Sku).save(sku);
      await this.movement(m, skuId, StockMovementType.RETURN, qty, ref);
      return sku;
    });
  }

  async adjust(
    skuId: string,
    opts: { delta?: number; setTo?: number; reason: string; by?: string },
  ) {
    let lowStock: {
      id: string;
      productId: string;
      productName: string;
      code: string;
      available: number;
    } | null = null;
    const sku = await this.run(undefined, async (m) => {
      const sku = await this.lock(m, skuId);
      const prevAvailable = sku.stock - sku.reserved;
      const newStock = opts.setTo !== undefined ? opts.setTo : sku.stock + (opts.delta ?? 0);
      if (newStock < 0) throw new ConflictException('Resulting stock cannot be negative');
      const change = newStock - sku.stock;
      sku.stock = newStock;
      await m.getRepository(Sku).save(sku);
      await this.movement(m, skuId, StockMovementType.ADJUST, change, {
        reason: opts.reason,
        createdBy: opts.by,
      });
      const newAvailable = sku.stock - sku.reserved;
      // Only when stock *crosses* into low — not on every adjust of an already-low SKU.
      if (
        sku.isActive &&
        newAvailable <= sku.lowStockThreshold &&
        prevAvailable > sku.lowStockThreshold
      ) {
        lowStock = {
          id: sku.id,
          productId: sku.productId,
          productName: sku.name ?? sku.sku,
          code: sku.sku,
          available: newAvailable,
        };
      }
      return sku;
    });
    // Emit after commit so a rolled-back adjust never raises a false alert.
    if (lowStock) {
      emitNotification(this.events, {
        type: NotificationType.LOW_STOCK,
        actorId: opts.by ?? null,
        actorType: opts.by ? NotificationActorType.ADMIN : NotificationActorType.SYSTEM,
        sku: lowStock,
      });
    }
    return sku;
  }

  private async lock(m: EntityManager, skuId: string): Promise<Sku> {
    const sku = await m.getRepository(Sku).findOne({
      where: { id: skuId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!sku) throw new NotFoundException('SKU not found');
    return sku;
  }

  private movement(
    m: EntityManager,
    skuId: string,
    type: StockMovementType,
    qty: number,
    ref: MovementRef,
  ) {
    return m.getRepository(StockMovement).save(
      m.getRepository(StockMovement).create({
        skuId,
        type,
        qty,
        reason: ref.reason ?? null,
        refType: ref.refType ?? null,
        refId: ref.refId ?? null,
        createdBy: ref.createdBy ?? null,
      }),
    );
  }

  private run<T>(mgr: EntityManager | undefined, fn: (m: EntityManager) => Promise<T>): Promise<T> {
    return mgr ? fn(mgr) : this.dataSource.transaction(fn);
  }
}
