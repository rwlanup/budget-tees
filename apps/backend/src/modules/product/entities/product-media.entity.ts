import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

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
}
