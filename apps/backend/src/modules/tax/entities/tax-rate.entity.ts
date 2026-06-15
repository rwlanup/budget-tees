import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { numeric } from '../../../common/utils/numeric-transformer';
import { TaxClass } from './tax-class.entity';

@Entity('tax_rates')
@Index('uq_tax_rate', ['taxClassId', 'countryCode'], { unique: true })
export class TaxRate extends BaseEntity {
  @Column({ type: 'uuid' })
  taxClassId: string;

  @ManyToOne(() => TaxClass, (tc) => tc.rates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taxClassId' })
  taxClass: TaxClass;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 2 })
  countryCode: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, transformer: numeric })
  rate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
