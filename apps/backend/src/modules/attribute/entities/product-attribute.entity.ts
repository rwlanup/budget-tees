import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from '../../product/entities/product.entity';
import { Attribute } from './attribute.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';

@Entity('product_attributes')
@Index('uq_product_attribute', ['productId', 'attributeId'], { unique: true })
export class ProductAttribute extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'uuid' })
  attributeId: string;

  @ManyToOne(() => Attribute, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute;

  @Column({ type: 'boolean', default: false })
  isVariation: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => ProductAttributeValue, (pav) => pav.productAttribute)
  values: ProductAttributeValue[];
}
