import { Injectable } from '@nestjs/common';
import { Cart } from './entities/cart.entity';
import { SkuService } from '../sku/services/sku.service';
import { SaleResolverService } from '../product-sale/services/sale-resolver.service';
import { ProductService } from '../product/product.service';
import { ProductMediaService } from '../product/product-media.service';
import { ProductStatus } from '../product/enums/product.enums';
import { MediaService } from '../media/services/media.service';
import { addMoney, multiplyMoney } from '../../common/utils/money';

export interface PricedCartLine {
  itemId: string;
  skuId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  onSale: boolean;
  lineTotal: number;
  available: number;
  inStock: boolean;
  unavailable: boolean;
  /** SKU image when set, else the product's primary image. */
  imageUrl: string | null;
}

export interface PricedCart {
  id: string;
  currency: string;
  itemCount: number;
  items: PricedCartLine[];
  subtotal: number;
  notes: string[];
}

/** Computes live prices (sale-adjusted) for a cart. Never trusts stored prices. */
@Injectable()
export class CartPricingService {
  constructor(
    private readonly skus: SkuService,
    private readonly sales: SaleResolverService,
    private readonly products: ProductService,
    private readonly media: MediaService,
    private readonly productMedia: ProductMediaService,
  ) {}

  async price(cart: Cart): Promise<PricedCart> {
    const items = cart.items ?? [];

    // Batch all per-line lookups up front (was 4 queries × line):
    //  • SKUs by id
    //  • products by the SKUs' productIds (any status — sales price unpublished
    //    products too; publish state only gates display/availability below)
    //  • one sale-pricer for every product
    //  • SKU images + (published) product primary images
    const skuMap = new Map(
      (await this.skus.findByIds(items.map((i) => i.skuId))).map((s) => [s.id, s]),
    );
    const productIds = [...new Set([...skuMap.values()].map((s) => s.productId))];
    const productMap = new Map((await this.products.findByIds(productIds)).map((p) => [p.id, p]));
    const pricer = await this.sales.buildPricer(
      [...productMap.values()].map((p) => ({ id: p.id, categoryId: p.categoryId })),
    );
    const skuImageUrl = new Map(
      (
        await this.media.findManyByIds(
          [...skuMap.values()].map((s) => s.imageMediaId).filter((id): id is string => !!id),
        )
      ).map((m) => [m.id, m.url]),
    );
    const primaryUrlByProduct = await this.productMedia.primaryMediaUrlByProduct(
      [...productMap.values()].filter((p) => p.status === ProductStatus.PUBLISHED).map((p) => p.id),
    );

    const lines: PricedCartLine[] = [];
    for (const item of items) {
      const sku = skuMap.get(item.skuId) ?? null;
      // Published product (or null) — mirrors the previous findOneByIdOrSlug(_, true).
      const rawProduct = sku ? (productMap.get(sku.productId) ?? null) : null;
      const product = rawProduct?.status === ProductStatus.PUBLISHED ? rawProduct : null;
      const unavailable = !sku || !sku.isActive || !product;
      const basePrice = sku?.price ?? 0;
      const resolved = sku
        ? pricer.price(sku.productId, basePrice)
        : { salePrice: 0, onSale: false };
      const unitPrice = resolved.salePrice;
      const available = sku ? sku.stock - sku.reserved : 0;
      // Prefer the variant's own image; fall back to the product's primary.
      const imageUrl = sku?.imageMediaId
        ? (skuImageUrl.get(sku.imageMediaId) ?? null)
        : product
          ? (primaryUrlByProduct.get(product.id) ?? null)
          : null;
      lines.push({
        itemId: item.id,
        skuId: item.skuId,
        productId: sku?.productId ?? '',
        productName: sku?.name ?? product?.name ?? '(unavailable)',
        quantity: item.quantity,
        unitPrice,
        basePrice,
        onSale: resolved.onSale,
        lineTotal: unavailable ? 0 : multiplyMoney(unitPrice, item.quantity),
        available,
        inStock: available >= item.quantity,
        unavailable,
        imageUrl,
      });
    }
    const subtotal = addMoney(...lines.filter((l) => !l.unavailable).map((l) => l.lineTotal));
    return {
      id: cart.id,
      currency: cart.currency,
      itemCount: lines.reduce((n, l) => n + l.quantity, 0),
      items: lines,
      subtotal,
      notes: ['estimated; taxes/shipping/coupons applied at checkout'],
    };
  }
}
