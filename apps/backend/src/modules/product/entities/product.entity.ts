import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Category } from '../../category/entities/category.entity';
import { Brand } from '../../brand/entities/brand.entity';
import { Tag } from '../../tag/entities/tag.entity';
import { ProductStatus, ProductType } from '../enums/product.enums';
import { Sku } from '../../sku/entities/sku.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 180 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 200 })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  shortDescription: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, { eager: true })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  brandId: string | null;

  @ManyToOne(() => Brand, { eager: true, nullable: true })
  @JoinColumn({ name: 'brandId' })
  brand: Brand | null;

  /** FK constraint to tax_classes added in the Tax migration. */
  @Column({ type: 'uuid', nullable: true })
  taxClassId: string | null;

  @Column({ type: 'enum', enum: ProductType, default: ProductType.SIMPLE })
  type: ProductType;

  @Index()
  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  /** FK constraint to skus added in the SKU migration. */
  @Column({ type: 'uuid', nullable: true })
  defaultSkuId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  metaDescription: string | null;

  @Index()
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @ManyToMany(() => Tag, { eager: true })
  @JoinTable({
    name: 'product_tags',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => Sku, (sku) => sku.product)
  skus: Sku[];
}
