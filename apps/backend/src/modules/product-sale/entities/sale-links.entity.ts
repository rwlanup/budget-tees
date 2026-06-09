import { Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('sale_products')
export class SaleProduct {
  @PrimaryColumn({ type: 'uuid' })
  saleId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  productId: string;
}

@Entity('sale_categories')
export class SaleCategory {
  @PrimaryColumn({ type: 'uuid' })
  saleId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  categoryId: string;
}

@Entity('sale_excluded_products')
export class SaleExcludedProduct {
  @PrimaryColumn({ type: 'uuid' })
  saleId: string;

  @Index()
  @PrimaryColumn({ type: 'uuid' })
  productId: string;
}
