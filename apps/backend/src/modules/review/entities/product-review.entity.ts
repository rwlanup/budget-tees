import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ReviewStatus } from '../enums/review.enums';

/** One review per (user, product). `orderId` is the purchase that unlocked it. */
@Entity('product_reviews')
@Index('uq_review_user_product', ['userId', 'productId'], { unique: true })
export class ProductReview extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

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
