import { Injectable } from '@nestjs/common';
import { CartService, CartContext } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { CouponContext, CouponLine } from './coupon-redemption.service';

/** Builds a CouponContext (lines + category lineage) from the caller's active cart. */
@Injectable()
export class CouponContextService {
  constructor(
    private readonly cart: CartService,
    private readonly products: ProductService,
    private readonly categories: CategoryService,
  ) {}

  async fromCart(ctx: CartContext): Promise<CouponContext> {
    const priced = await this.cart.getPriced(ctx);
    const available = priced.items.filter((line) => !line.unavailable);

    // Batch the per-line product fetch; resolve ancestors once per unique
    // category (was a product lookup + ancestor CTE per line).
    const products = await this.products.findByIds([...new Set(available.map((l) => l.productId))]);
    const categoryByProduct = new Map(products.map((p) => [p.id, p.categoryId]));
    const lineageByCategory = new Map<string, string[]>();
    for (const categoryId of new Set(categoryByProduct.values())) {
      const ancestors = await this.categories.ancestors(categoryId).catch(() => []);
      lineageByCategory.set(categoryId, [categoryId, ...ancestors.map((c) => c.id)]);
    }

    const lines: CouponLine[] = available.map((line) => {
      const categoryId = categoryByProduct.get(line.productId);
      return {
        productId: line.productId,
        categoryLineage: categoryId ? (lineageByCategory.get(categoryId) ?? []) : [],
        lineTotal: line.lineTotal,
      };
    });
    return { userId: ctx.userId, subtotal: priced.subtotal, lines };
  }

  async categoryLineage(productId: string): Promise<string[]> {
    const product = await this.products.findOneByIdOrSlug(productId, false).catch(() => null);
    if (!product) return [];
    const ancestors = await this.categories.ancestors(product.categoryId).catch(() => []);
    return [product.categoryId, ...ancestors.map((c) => c.id)];
  }
}
