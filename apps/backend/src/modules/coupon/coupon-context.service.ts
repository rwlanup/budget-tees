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
    const lines: CouponLine[] = [];
    for (const line of priced.items) {
      if (line.unavailable) continue;
      const lineage = await this.categoryLineage(line.productId);
      lines.push({
        productId: line.productId,
        categoryLineage: lineage,
        lineTotal: line.lineTotal,
      });
    }
    return { userId: ctx.userId, subtotal: priced.subtotal, lines };
  }

  async categoryLineage(productId: string): Promise<string[]> {
    const product = await this.products.findOneByIdOrSlug(productId, false).catch(() => null);
    if (!product) return [];
    const ancestors = await this.categories.ancestors(product.categoryId).catch(() => []);
    return [product.categoryId, ...ancestors.map((c) => c.id)];
  }
}
