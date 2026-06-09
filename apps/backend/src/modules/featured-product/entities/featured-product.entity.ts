import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('featured_products')
export class FeaturedProduct extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  featuredAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;
}
