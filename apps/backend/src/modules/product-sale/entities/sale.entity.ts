import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SaleScope, SaleType } from '../enums/sale.enums';

const numeric = {
  to: (v: number) => v,
  from: (v: string | null) => (v === null ? 0 : parseFloat(v)),
};
const numericNullable = {
  to: (v: number | null) => v,
  from: (v: string | null) => (v === null ? null : parseFloat(v)),
};

@Entity('sales')
export class Sale extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'enum', enum: SaleType })
  type: SaleType;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  value: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericNullable,
  })
  maxDiscountAmount: number | null;

  @Column({ type: 'enum', enum: SaleScope })
  scope: SaleScope;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
