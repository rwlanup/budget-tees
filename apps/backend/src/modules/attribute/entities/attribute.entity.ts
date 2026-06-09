import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AttributeType } from '../enums/attribute-type.enum';
import { AttributeValue } from './attribute-value.entity';

@Entity('attributes')
export class Attribute extends BaseEntity {
  @Column({ type: 'citext' })
  @Index({ unique: true })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'enum', enum: AttributeType })
  type: AttributeType;

  @Column({ type: 'boolean', default: false })
  isVariation: boolean;

  @Column({ type: 'boolean', default: true })
  isFilterable: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @OneToMany(() => AttributeValue, (v) => v.attribute, { eager: true, cascade: true })
  values: AttributeValue[];
}
