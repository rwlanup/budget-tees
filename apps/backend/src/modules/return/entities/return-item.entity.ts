import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { numericNullable } from '../../../common/utils/numeric-transformer';
import { ItemCondition } from '../enums/return.enums';
import { ReturnRequest } from './return-request.entity';
import { SkuSnapshot } from '../../sku/entities/sku.entity';

@Entity('return_items')
export class ReturnItem extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  returnRequestId: string;

  @ManyToOne(() => ReturnRequest, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'returnRequestId' })
  request: ReturnRequest;

  @Column({ type: 'uuid' })
  orderItemId: string;

  @Column({ type: 'uuid' })
  skuId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'uuid', nullable: true })
  exchangeSkuId: string | null;

  /** Snapshot of the chosen replacement SKU (EXCHANGE only) — captured at request time. */
  @Column({ type: 'jsonb', nullable: true })
  exchangeSku: SkuSnapshot | null;

  @Column({ type: 'enum', enum: ItemCondition, nullable: true })
  conditionOnReceipt: ItemCondition | null;

  @Column({ type: 'boolean', default: false })
  restock: boolean;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericNullable,
  })
  lineRefundAmount: number | null;
}
