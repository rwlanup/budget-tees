import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

const numeric = {
  to: (v: number) => v,
  from: (v: string | null) => (v === null ? 0 : parseFloat(v)),
};

@Entity('tax_rates')
@Index('uq_tax_rate', ['taxClassId', 'countryCode'], { unique: true })
export class TaxRate extends BaseEntity {
  @Column({ type: 'uuid' })
  taxClassId: string;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'varchar', length: 2 })
  countryCode: string;

  @Column({ type: 'numeric', precision: 5, scale: 2, transformer: numeric })
  rate: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
