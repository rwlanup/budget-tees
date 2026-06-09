import { Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('product_attribute_values')
export class ProductAttributeValue {
  @PrimaryColumn({ type: 'uuid' })
  productAttributeId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  attributeValueId: string;
}
