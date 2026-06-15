import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { numeric } from '../../../common/utils/numeric-transformer';
import { Order } from './order.entity';
import { Sku } from '../../sku/entities/sku.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid' })
  skuId: string;

  @ManyToOne(() => Sku, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skuId' })
  sku: Sku;

  // productId is an immutable snapshot reference (no FK) — intentionally not mapped to a relation.
  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 180 })
  productName: string;

  @Column({ type: 'varchar', length: 64 })
  skuCode: string;

  @Column({ type: 'jsonb', nullable: true })
  variant: Record<string, string> | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  unitBasePrice: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  unitPrice: number;

  @Column({ type: 'uuid', nullable: true })
  sourceSaleId: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numeric })
  discountAllocated: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numeric })
  taxAmount: number;

  @Column({ type: 'varchar', length: 60, nullable: true })
  taxRateLabel: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  lineTotal: number;
}
