import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
      let basePrice = 0;
      let salePrice = 0;
      let onSale = false;
      if (product.defaultSkuId) {
        const sku = await this.skus.findOne(product.defaultSkuId).catch(() => null);
        if (sku) {
          basePrice = sku.price;
          const resolved = await this.sales.resolveForProduct(product.id, sku.price);
          salePrice = resolved.salePrice;
          onSale = resolved.onSale;
        }
      }
      items.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        basePrice,
        salePrice,
        onSale,
        addedAt: row.addedAt,
      });
    }
    return items;
  }

  async add(userId: string, productId: string): Promise<{ wishlisted: true }> {
    await this.products.findOneByIdOrSlug(productId, true); // must be published
    const existing = await this.repo.findOne({ where: { userId, productId } });
    if (!existing) await this.repo.save(this.repo.create({ userId, productId }));
    return { wishlisted: true };
  }

  async remove(userId: string, productId: string): Promise<{ wishlisted: false }> {
    await this.repo.delete({ userId, productId });
    return { wishlisted: false };
  }

  async toggle(userId: string, productId: string): Promise<{ wishlisted: boolean }> {
    const existing = await this.repo.findOne({ where: { userId, productId } });
    if (existing) {
      await this.repo.remove(existing);
      return { wishlisted: false };
    }
    await this.products.findOneByIdOrSlug(productId, true);
    await this.repo.save(this.repo.create({ userId, productId }));
    return { wishlisted: true };
  }

  async contains(userId: string, productId: string): Promise<{ wishlisted: boolean }> {
    const existing = await this.repo.findOne({ where: { userId, productId } });
    return { wishlisted: !!existing };
  }

  async moveToCart(
    userId: string,
    productId: string,
    skuId: string,
    quantity: number,
    removeFromWishlist = true,
  ) {
    const sku = await this.skus.findOne(skuId);
    if (sku.productId !== productId) {
      throw new BadRequestException('SKU does not belong to this product');
    }
    const result = await this.cart.addItem({ userId }, { skuId, quantity });
    if (removeFromWishlist) await this.repo.delete({ userId, productId });
    return result;
  }
}
