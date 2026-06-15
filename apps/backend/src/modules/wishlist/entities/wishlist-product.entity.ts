import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';
import { Sku } from '../../sku/entities/sku.entity';

@Entity('wishlist_products')
@Index('uq_wishlist_user_sku', ['userId', 'skuId'], { unique: true })
export class WishlistProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Index()
  @Column({ type: 'uuid' })
  skuId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Sku, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skuId' })
  sku: Sku;

  @CreateDateColumn({ type: 'timestamptz' })
  addedAt: Date;
}
