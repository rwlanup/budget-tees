import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Sale } from '../entities/sale.entity';
import { SaleCategory, SaleExcludedProduct, SaleProduct } from '../entities/sale-links.entity';
import { SaleScope, SaleType } from '../enums/sale.enums';
import { SaleService } from './sale.service';
import { CategoryService } from '../../category/category.service';
import { ProductService } from '../../product/product.service';
import { round2 } from '../../../common/utils/money';

export interface ResolvedPrice {
  basePrice: number;
  salePrice: number;
  onSale: boolean;
  sourceSaleId: string | null;
  discountPct: number;
  saleEndsAt: Date | null;
}

@Injectable()
export class SaleResolverService {
  constructor(
    @InjectRepository(Sale) private readonly saleRepo: Repository<Sale>,
    @InjectRepository(SaleProduct) private readonly spRepo: Repository<SaleProduct>,
    @InjectRepository(SaleCategory) private readonly scRepo: Repository<SaleCategory>,
    @InjectRepository(SaleExcludedProduct) private readonly sxRepo: Repository<SaleExcludedProduct>,
    private readonly sales: SaleService,
    private readonly categories: CategoryService,
    private readonly products: ProductService,
  ) {}

  /** Resolve the best (lowest) active sale price for a product. */
  async resolveForProduct(productId: string, basePrice: number): Promise<ResolvedPrice> {
    const none: ResolvedPrice = {
      basePrice,
      salePrice: basePrice,
      onSale: false,
      sourceSaleId: null,
      discountPct: 0,
      saleEndsAt: null,
    };

    const active = await this.sales.activeSales();
    if (!active.length) return none;

    const product = await this.products.findOneByIdOrSlug(productId, false).catch(() => null);
    if (!product) return none;

    const lineage = [
      product.categoryId,
      ...(await this.categories.ancestors(product.categoryId)).map((c) => c.id),
    ];
    const saleIds = active.map((s) => s.id);

    const [productLinks, excludedLinks, categoryLinks] = await Promise.all([
      this.spRepo.find({ where: { saleId: In(saleIds), productId } }),
      this.sxRepo.find({ where: { saleId: In(saleIds), productId } }),
      lineage.length
        ? this.scRepo.find({ where: { saleId: In(saleIds), categoryId: In(lineage) } })
        : Promise.resolve([]),
    ]);
    const inProducts = new Set(productLinks.map((l) => l.saleId));
    const excluded = new Set(excludedLinks.map((l) => l.saleId));
    const inCategory = new Set(categoryLinks.map((l) => l.saleId));

    let best = none;
    for (const sale of active) {
      const matched =
        sale.scope === SaleScope.STORE_WIDE
          ? !excluded.has(sale.id)
          : sale.scope === SaleScope.PRODUCTS
            ? inProducts.has(sale.id)
            : inCategory.has(sale.id) && !excluded.has(sale.id);
      if (!matched) continue;

      const salePrice = this.candidatePrice(sale, basePrice);
      if (salePrice < best.salePrice) {
        best = {
          basePrice,
          salePrice,
          onSale: salePrice < basePrice,
          sourceSaleId: sale.id,
          discountPct: basePrice > 0 ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0,
          saleEndsAt: sale.endsAt,
        };
      }
    }
    return best;
  }

  private candidatePrice(sale: Sale, base: number): number {
    if (sale.type === SaleType.PERCENTAGE) {
      let discount = (base * sale.value) / 100;
      if (sale.maxDiscountAmount != null) discount = Math.min(discount, sale.maxDiscountAmount);
      return Math.max(0, round2(base - discount));
    }
    return Math.max(0, round2(base - sale.value));
  }
}
