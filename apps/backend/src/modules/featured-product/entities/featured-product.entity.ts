import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('featured_products')
export class FeaturedProduct extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

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
