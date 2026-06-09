import { Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('sku_attribute_values')
export class SkuAttributeValue {
  @PrimaryColumn({ type: 'uuid' })
  skuId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  attributeValueId: string;
}
