import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Product } from './product.entity';
import { Media } from '../../media/entities/media.entity';

@Entity('product_media')
export class ProductMedia {
  @PrimaryColumn({ type: 'uuid' })
  productId: string;

  @PrimaryColumn({ type: 'uuid' })
  mediaId: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Index()
  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @ManyToOne(() => Product, (p) => p.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Media, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mediaId' })
  media: Media;
}
