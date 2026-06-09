import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ResolutionType, ReturnReason, ReturnStatus } from '../enums/return.enums';
import { ReturnItem } from './return-item.entity';

const numericNullable = {
  to: (v: number | null) => v,
  from: (v: string | null) => (v === null ? null : parseFloat(v)),
};

@Entity('return_requests')
export class ReturnRequest extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  returnNumber: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'enum', enum: ResolutionType })
  resolutionType: ResolutionType;

  @Index()
  @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.REQUESTED })
  status: ReturnStatus;

  @Column({ type: 'enum', enum: ReturnReason })
  reason: ReturnReason;

  @Column({ type: 'varchar', length: 500, nullable: true })
  customerNote: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  adminNote: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: numericNullable })
  refundAmount: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: numericNullable })
  priceDifference: number | null;

  @Column({ type: 'uuid', nullable: true })
  processedBy: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @OneToMany(() => ReturnItem, (i) => i.request, { eager: true, cascade: true })
  items: ReturnItem[];
}
