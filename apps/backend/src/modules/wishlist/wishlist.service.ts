import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistProduct } from './entities/wishlist-product.entity';
import { ProductService } from '../product/product.service';
import { SkuService } from '../sku/services/sku.service';
import { SaleResolverService } from '../product-sale/services/sale-resolver.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistProduct) private readonly repo: Repository<WishlistProduct>,
    private readonly products: ProductService,
    private readonly skus: SkuService,
    private readonly sales: SaleResolverService,
    private readonly cart: CartService,
  ) {}

  async list(userId: string) {
    const rows = await this.repo.find({ where: { userId }, order: { addedAt: 'DESC' } });
    const items: Array<Record<string, unknown>> = [];
    for (const row of rows) {
      const product = await this.products.findOneByIdOrSlug(row.productId, true).catch(() => null);
      if (!product) continue; // unpublished/deleted — skip
      const sku = await this.skus.findOne(row.skuId).catch(() => null);
      if (!sku) continue; // sku deleted — skip
      const resolved = await this.sales.resolveForProduct(product.id, sku.price);
      items.push({
        skuId: sku.id,
        productId: product.id,
        // sku.name is the human variant label ("<product> <value> …"); fall back to product.
        name: sku.name ?? product.name,
        productName: product.name,
        slug: product.slug,
        imageMediaId: sku.imageMediaId,
        basePrice: sku.price,
        salePrice: resolved.salePrice,
        onSale: resolved.onSale,
        inStock: sku.stock - sku.reserved > 0 || sku.allowBackorder,
        addedAt: row.addedAt,
      });
    }
    return items;
  }

  /** Validates the SKU is sellable (active + on a published product); returns its productId. */
  private async assertSellable(skuId: string): Promise<string> {
    const sku = await this.skus.findOne(skuId);
    if (!sku.isActive) throw new BadRequestException('This variant is not available');
    await this.products.findOneByIdOrSlug(sku.productId, true); // must be published
    return sku.productId;
  }

  async add(userId: string, skuId: string): Promise<{ wishlisted: true }> {
    const productId = await this.assertSellable(skuId);
    const existing = await this.repo.findOne({ where: { userId, skuId } });
    if (!existing) await this.repo.save(this.repo.create({ userId, productId, skuId }));
    return { wishlisted: true };
  }

  async remove(userId: string, skuId: string): Promise<{ wishlisted: false }> {
    await this.repo.delete({ userId, skuId });
    return { wishlisted: false };
  }

  async toggle(userId: string, skuId: string): Promise<{ wishlisted: boolean }> {
    const existing = await this.repo.findOne({ where: { userId, skuId } });
    if (existing) {
      await this.repo.remove(existing);
      return { wishlisted: false };
    }
    const productId = await this.assertSellable(skuId);
    await this.repo.save(this.repo.create({ userId, productId, skuId }));
    return { wishlisted: true };
  }

  async contains(userId: string, skuId: string): Promise<{ wishlisted: boolean }> {
    const existing = await this.repo.findOne({ where: { userId, skuId } });
    return { wishlisted: !!existing };
  }

  /**
   * Saved-row count for the header badge. Raw count (cheap, single query); may
   * include rows whose product is now unpublished — `list` filters those out.
   */
  async count(userId: string): Promise<{ count: number }> {
    return { count: await this.repo.count({ where: { userId } }) };
  }

  async moveToCart(userId: string, skuId: string, quantity: number, removeFromWishlist = true) {
    const result = await this.cart.addItem({ userId }, { skuId, quantity });
    if (removeFromWishlist) await this.repo.delete({ userId, skuId });
    return result;
  }
}
