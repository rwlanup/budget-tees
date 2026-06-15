import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from '../../product/entities/product.entity';
import { User } from '../../user/entities/user.entity';
import { Order } from '../../order/entities/order.entity';
import { ReviewStatus } from '../enums/review.enums';

/** One review per (user, product). `orderId` is the purchase that unlocked it. */
@Entity('product_reviews')
@Index('uq_review_user_product', ['userId', 'productId'], { unique: true })
export class ProductReview extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order: Order | null;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'varchar', length: 120, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  body: string | null;

  @Index()
  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PUBLISHED })
  status: ReviewStatus;
}
