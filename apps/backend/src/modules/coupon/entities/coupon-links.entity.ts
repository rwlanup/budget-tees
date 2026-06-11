import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RedemptionStatus } from '../enums/coupon.enums';

const numeric = {
  to: (v: number) => v,
  from: (v: string | null) => (v === null ? 0 : parseFloat(v)),
};

@Entity('coupon_products')
export class CouponProduct {
  @PrimaryColumn({ type: 'uuid' })
  couponId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  productId: string;
}

@Entity('coupon_categories')
export class CouponCategory {
  @PrimaryColumn({ type: 'uuid' })
  couponId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  categoryId: string;
}

@Entity('coupon_redemptions')
export class CouponRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  couponId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  /** FK to orders added in the Order migration. */
  @Index()
  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  discountAmount: number;

  @Column({ type: 'enum', enum: RedemptionStatus, default: RedemptionStatus.APPLIED })
  status: RedemptionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  redeemedAt: Date;
}
