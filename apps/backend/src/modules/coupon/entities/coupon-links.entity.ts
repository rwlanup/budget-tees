import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RedemptionStatus } from '../enums/coupon.enums';
import { numeric } from '../../../common/utils/numeric-transformer';
import { Coupon } from './coupon.entity';
import { Product } from '../../product/entities/product.entity';
import { Category } from '../../category/entities/category.entity';
import { Order } from '../../order/entities/order.entity';
import { User } from '../../user/entities/user.entity';

@Entity('coupon_products')
export class CouponProduct {
  @PrimaryColumn({ type: 'uuid' })
  couponId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Coupon, (c) => c.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}

@Entity('coupon_categories')
export class CouponCategory {
  @PrimaryColumn({ type: 'uuid' })
  couponId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Coupon, (c) => c.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}

@Entity('coupon_redemptions')
export class CouponRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  couponId: string;

  @ManyToOne(() => Coupon, (c) => c.redemptions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  /** FK to orders added in the Order migration. */
  @Index()
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  discountAmount: number;

  @Column({ type: 'enum', enum: RedemptionStatus, default: RedemptionStatus.APPLIED })
  status: RedemptionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  redeemedAt: Date;
}
