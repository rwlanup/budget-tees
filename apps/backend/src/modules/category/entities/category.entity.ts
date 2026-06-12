import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Media } from '../../media/entities/media.entity';

/**
 * Adjacency-list tree (self-referencing parentId). Subtree/ancestor queries use
 * recursive CTEs in CategoryService (reliable with hand-written migrations;
 * equivalent behavior to a closure table).
 */
@Entity('categories')
export class Category extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 140 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Category, (c) => c.children, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'parentId' })
  parent: Category | null;

  @OneToMany(() => Category, (c) => c.parent)
  children: Category[];

  @Column({ type: 'uuid', nullable: true })
  imageMediaId: string | null;

  /** Transient (non-persisted): resolved media for `imageMediaId`, loaded on reads. */
  image?: Media | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaDescription: string | null;
}
