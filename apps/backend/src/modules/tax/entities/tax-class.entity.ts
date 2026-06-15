import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { TaxRate } from './tax-rate.entity';

@Entity('tax_classes')
export class TaxClass extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => TaxRate, (r) => r.taxClass)
  rates: TaxRate[];
}
