import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Sale } from './sale.entity';
import { Product } from '../../product/entities/product.entity';
import { Category } from '../../category/entities/category.entity';

@Entity('sale_products')
export class SaleProduct {
  @PrimaryColumn({ type: 'uuid' })
  saleId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Sale, (s) => s.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}

@Entity('sale_categories')
export class SaleCategory {
  @PrimaryColumn({ type: 'uuid' })
  saleId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Sale, (s) => s.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}

@Entity('sale_excluded_products')
export class SaleExcludedProduct {
  @PrimaryColumn({ type: 'uuid' })
  saleId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Sale, (s) => s.excludedProducts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}
