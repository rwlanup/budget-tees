import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { numeric, numericNullable } from '../../../common/utils/numeric-transformer';
import { Product } from '../../product/entities/product.entity';
import { Media } from '../../media/entities/media.entity';
import { SkuAttributeValue } from './sku-attribute-value.entity';

/**
 * Immutable display snapshot of a SKU at a point in time. Stored (e.g. on a
 * return's exchange item) so the chosen variant's details survive later price,
 * name, or catalog changes. Mirrors the order-item snapshot shape.
 */
export interface SkuSnapshot {
  skuId: string;
  skuCode: string;
  productId: string;
  productName: string;
  variant: Record<string, string> | null;
  unitPrice: number;
  imageMediaId: string | null;
}

@Entity('skus')
export class Sku extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  sku: string;

  // Human-facing variant name. Auto-derived ("<product> <value> <value>") when not supplied.
  @Column({ type: 'varchar', length: 200, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  barcode: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  price: number;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericNullable,
  })
  compareAtPrice: number | null;

  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericNullable,
  })
  costPrice: number | null;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'int', default: 0 })
  reserved: number;

  @Column({ type: 'int', default: 0 })
  lowStockThreshold: number;

  @Column({ type: 'boolean', default: false })
  allowBackorder: boolean;

  @Column({ type: 'int', nullable: true })
  weightGrams: number | null;

  @Column({ type: 'uuid', nullable: true })
  imageMediaId: string | null;

  @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'imageMediaId' })
  image: Media | null;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  /** Derived convenience (not persisted). */
  get available(): number {
    return this.stock - this.reserved;
  }

  @ManyToOne(() => Product, (product) => product.skus)
  product: Product;

  @OneToMany(() => SkuAttributeValue, (sav) => sav.sku)
  attributeValues: SkuAttributeValue[];
}
