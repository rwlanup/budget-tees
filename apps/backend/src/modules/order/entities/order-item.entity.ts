import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Order } from './order.entity';

const numeric = {
  to: (v: number) => v,
  from: (v: string | null) => (v === null ? 0 : parseFloat(v)),
};
const numericNullable = {
  to: (v: number | null) => v,
  from: (v: string | null) => (v === null ? null : parseFloat(v)),
};

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
