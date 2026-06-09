import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('product_attributes')
@Index('uq_product_attribute', ['productId', 'attributeId'], { unique: true })
export class ProductAttribute extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'uuid' })
  attributeId: string;

  @Column({ type: 'boolean', default: false })
  isVariation: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
