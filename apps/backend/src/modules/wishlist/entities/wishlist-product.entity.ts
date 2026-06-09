import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('wishlist_products')
@Index('uq_wishlist_user_product', ['userId', 'productId'], { unique: true })
export class WishlistProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  addedAt: Date;
}
