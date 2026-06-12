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

  /**
   * Build a SQL expression (+ bound params) that computes the effective sale
   * price of a SKU in-database, mirroring `resolveForProduct` (active window,
   * scope matching, lowest-price-wins, cap/floor/round-2). Intended for storefront
   * ORDER BY so price sorting reflects active sales without loading every SKU.
   *
   * `cols` are raw SQL column refs into the caller's query: the SKU base price,
   * the product id, and the product's category id. Returns `null` when no sales
   * are active so the caller can fall back to the plain base-price column.
   */
  async buildPriceSortExpression(cols: {
    basePrice: string;
    productId: string;
    categoryId: string;
  }): Promise<{ sql: string; params: Record<string, unknown> } | null> {
    const active = await this.sales.activeSales();
    if (!active.length) return null;

    const saleIds = active.map((s) => s.id);
    const [productLinks, excludedLinks, categoryLinks] = await Promise.all([
      this.spRepo.find({ where: { saleId: In(saleIds) } }),
      this.sxRepo.find({ where: { saleId: In(saleIds) } }),
      this.scRepo.find({ where: { saleId: In(saleIds) } }),
    ]);

    const group = <T>(rows: T[], key: (r: T) => string, val: (r: T) => string) => {
      const m = new Map<string, string[]>();
      for (const r of rows) (m.get(key(r)) ?? m.set(key(r), []).get(key(r))!).push(val(r));
      return m;
    };
    const productsBySale = group(productLinks, (l) => l.saleId, (l) => l.productId);
    const excludedBySale = group(excludedLinks, (l) => l.saleId, (l) => l.productId);
    const catsBySale = group(categoryLinks, (l) => l.saleId, (l) => l.categoryId);

    // CATEGORIES scope: a product matches when its own category is the sale's
    // category or any descendant of it. Expanding each sale category to
    // self + descendants is equivalent to the resolver's lineage(self+ancestors)
    // ∩ sale_categories, but lets us match on the product's single categoryId.
    const coveredBySale = new Map<string, string[]>();
    for (const sale of active) {
      if (sale.scope !== SaleScope.CATEGORIES) continue;
      const baseCats = catsBySale.get(sale.id) ?? [];
      if (!baseCats.length) continue;
      const covered = new Set<string>(baseCats);
      for (const cid of baseCats) {
        for (const d of await this.categories.descendantIds(cid)) covered.add(d);
      }
      coveredBySale.set(sale.id, [...covered]);
    }

    const params: Record<string, unknown> = {};
    const cases: string[] = [];
    active.forEach((sale, i) => {
      const p = `sps${i}`;
      let match: string;
      if (sale.scope === SaleScope.STORE_WIDE) {
        params[`${p}excl`] = excludedBySale.get(sale.id) ?? [];
        match = `${cols.productId} <> ALL(:${p}excl::uuid[])`;
      } else if (sale.scope === SaleScope.PRODUCTS) {
        const prods = productsBySale.get(sale.id) ?? [];
        if (!prods.length) return; // scoped to products but none linked → matches nothing
        params[`${p}prod`] = prods;
        match = `${cols.productId} = ANY(:${p}prod::uuid[])`;
      } else {
        const covered = coveredBySale.get(sale.id) ?? [];
        if (!covered.length) return;
        params[`${p}cats`] = covered;
        params[`${p}excl`] = excludedBySale.get(sale.id) ?? [];
        match = `${cols.categoryId} = ANY(:${p}cats::uuid[]) AND ${cols.productId} <> ALL(:${p}excl::uuid[])`;
      }

      params[`${p}val`] = sale.value;
      let price: string;
      if (sale.type === SaleType.PERCENTAGE) {
        if (sale.maxDiscountAmount != null) {
          params[`${p}max`] = sale.maxDiscountAmount;
          price = `GREATEST(0, ROUND(${cols.basePrice} - LEAST(${cols.basePrice} * :${p}val / 100, :${p}max), 2))`;
        } else {
          price = `GREATEST(0, ROUND(${cols.basePrice} - ${cols.basePrice} * :${p}val / 100, 2))`;
        }
      } else {
        price = `GREATEST(0, ROUND(${cols.basePrice} - :${p}val, 2))`;
      }

      cases.push(`CASE WHEN (${match}) THEN ${price} END`);
    });

    if (!cases.length) return null;
    // LEAST ignores the NULLs produced by non-matching CASEs; base price guarantees
    // a non-null floor, so a SKU with no matching sale sorts by its own price.
    return { sql: `LEAST(${cols.basePrice}, ${cases.join(', ')})`, params };
  }
}
