import { Injectable } from '@nestjs/common';
import { Cart } from './entities/cart.entity';
import { SkuService } from '../sku/services/sku.service';
import { SaleResolverService } from '../product-sale/services/sale-resolver.service';
import { ProductService } from '../product/product.service';
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
  ) {}

  async price(cart: Cart): Promise<PricedCart> {
    const lines: PricedCartLine[] = [];
    for (const item of cart.items ?? []) {
      const sku = await this.skus.findOne(item.skuId).catch(() => null);
      const product = sku
        ? await this.products.findOneByIdOrSlug(sku.productId, true).catch(() => null)
        : null;
      const unavailable = !sku || !sku.isActive || !product;
      const basePrice = sku?.price ?? 0;
      const resolved = sku
        ? await this.sales.resolveForProduct(sku.productId, basePrice)
        : { salePrice: 0, onSale: false };
      const unitPrice = resolved.salePrice;
      const available = sku ? sku.stock - sku.reserved : 0;
      lines.push({
        itemId: item.id,
        skuId: item.skuId,
        productId: sku?.productId ?? '',
        productName: product?.name ?? '(unavailable)',
        quantity: item.quantity,
        unitPrice,
        basePrice,
        onSale: resolved.onSale,
        lineTotal: unavailable ? 0 : multiplyMoney(unitPrice, item.quantity),
        available,
        inStock: available >= item.quantity,
        unavailable,
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
