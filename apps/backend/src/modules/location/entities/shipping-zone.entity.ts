import { Column, Entity, Index, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

const numeric = {
  to: (v: number) => v,
  from: (v: string | null) => (v === null ? 0 : parseFloat(v)),
};
const numericNullable = {
  to: (v: number | null) => v,
  from: (v: string | null) => (v === null ? null : parseFloat(v)),
};

@Entity('shipping_zones')
export class ShippingZone extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 2 })
  countryCode: string;

  @Column({ type: 'boolean', default: false })
  isCountryWide: boolean;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  flatRate: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: numericNullable })
  freeShippingThreshold: number | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => ShippingZoneRegion, (r) => r.zone, { eager: true, cascade: true })
  regions: ShippingZoneRegion[];
}

@Entity('shipping_zone_regions')
export class ShippingZoneRegion extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  zoneId: string;

  @ManyToOne(() => ShippingZone, (z) => z.regions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'zoneId' })
  zone: ShippingZone;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  region: string;
}
