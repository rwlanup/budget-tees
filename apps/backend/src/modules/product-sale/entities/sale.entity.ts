import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { numeric, numericNullable } from '../../../common/utils/numeric-transformer';
import { SaleScope, SaleType } from '../enums/sale.enums';
import { SaleCategory, SaleExcludedProduct, SaleProduct } from './sale-links.entity';

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

  @OneToMany(() => SaleProduct, (sp) => sp.sale)
  products: SaleProduct[];

  @OneToMany(() => SaleCategory, (sc) => sc.sale)
  categories: SaleCategory[];

  @OneToMany(() => SaleExcludedProduct, (sx) => sx.sale)
  excludedProducts: SaleExcludedProduct[];
}
