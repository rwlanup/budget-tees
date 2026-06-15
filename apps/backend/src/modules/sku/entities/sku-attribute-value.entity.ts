import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Sku } from './sku.entity';
import { AttributeValue } from '../../attribute/entities/attribute-value.entity';

@Entity('sku_attribute_values')
export class SkuAttributeValue {
  @PrimaryColumn({ type: 'uuid' })
  skuId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  attributeValueId: string;

  @ManyToOne(() => Sku, (sku) => sku.attributeValues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skuId' })
  sku: Sku;

  @ManyToOne(() => AttributeValue, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attributeValueId' })
  attributeValue: AttributeValue;
}
