import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ProductAttribute } from './product-attribute.entity';
import { AttributeValue } from './attribute-value.entity';

@Entity('product_attribute_values')
export class ProductAttributeValue {
  @PrimaryColumn({ type: 'uuid' })
  productAttributeId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  attributeValueId: string;

  @ManyToOne(() => ProductAttribute, (pa) => pa.values, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productAttributeId' })
  productAttribute: ProductAttribute;

  @ManyToOne(() => AttributeValue, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attributeValueId' })
  attributeValue: AttributeValue;
}
