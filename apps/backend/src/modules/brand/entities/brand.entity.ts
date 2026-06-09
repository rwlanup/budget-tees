import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('brands')
export class Brand extends BaseEntity {
  @Column({ type: 'citext' })
  @Index({ unique: true })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 140 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true })
  logoMediaId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  websiteUrl: string | null;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaDescription: string | null;
}
