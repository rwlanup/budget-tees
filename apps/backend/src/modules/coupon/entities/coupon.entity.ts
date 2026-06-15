import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { numericNullable } from '../../../common/utils/numeric-transformer';
import { CouponAppliesTo, CouponType } from '../enums/coupon.enums';
import { CouponCategory, CouponProduct, CouponRedemption } from './coupon-links.entity';

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'citext' })
  code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericNullable,
  })
  value: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericNullable,
  })
  maxDiscountAmount: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericNullable,
  })
  minOrderAmount: number | null;

  @Column({ type: 'enum', enum: CouponAppliesTo, default: CouponAppliesTo.ALL })
  appliesTo: CouponAppliesTo;

  @Column({ type: 'boolean', default: false })
  firstOrderOnly: boolean;

  @Column({ type: 'int', nullable: true })
  usageLimit: number | null;

  @Column({ type: 'int', nullable: true, default: 1 })
  usageLimitPerUser: number | null;

  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => CouponProduct, (cp) => cp.coupon)
  products: CouponProduct[];

  @OneToMany(() => CouponCategory, (cc) => cc.coupon)
  categories: CouponCategory[];

  @OneToMany(() => CouponRedemption, (r) => r.coupon)
  redemptions: CouponRedemption[];
}
