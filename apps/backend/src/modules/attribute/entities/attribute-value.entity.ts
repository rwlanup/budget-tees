import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Attribute } from './attribute.entity';

@Entity('attribute_values')
@Index('uq_attr_value', ['attributeId', 'value'], { unique: true })
@Index('uq_attr_slug', ['attributeId', 'slug'], { unique: true })
export class AttributeValue extends BaseEntity {
  @Column({ type: 'uuid' })
  attributeId: string;

  @ManyToOne(() => Attribute, (a) => a.values, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute;

  @Column({ type: 'varchar', length: 120 })
  value: string;

  @Column({ type: 'varchar', length: 140 })
  slug: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;
}
