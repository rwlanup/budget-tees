import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('tags')
export class Tag extends BaseEntity {
  @Column({ type: 'citext' })
  @Index({ unique: true })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  slug: string;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
