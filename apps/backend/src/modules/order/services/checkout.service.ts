import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, In, Repository } from 'typeorm';
import { emitNotification } from '../../notification/notification-event';
import {
  NotificationActorType,
  NotificationType,
} from '../../notification/enums/notification.enums';
import { Order, AddressSnapshot } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { FulfillmentMethod, OrderStatus, PaymentStatus } from '../enums/order.enums';
import { OrderStatusService } from './order-status.service';
import { CheckoutDto, AddressInputDto } from '../dto/checkout.dto';
import { CartService } from '../../cart/cart.service';
import { CartPricingService, PricedCart, PricedCartLine } from '../../cart/cart-pricing.service';
import { ProductService } from '../../product/product.service';
import { SkuService } from '../../sku/services/sku.service';
import { InventoryService } from '../../sku/services/inventory.service';
import { SaleResolverService } from '../../product-sale/services/sale-resolver.service';
import { TaxCalculatorService } from '../../tax/services/tax-calculator.service';
import { ShippingCalculatorService } from '../../location/services/shipping-calculator.service';
import { PickupService } from '../../location/services/pickup.service';
import { ShippingMethod } from '../../location/enums/location.enums';
import { CategoryService } from '../../category/category.service';
import { CouponRedemptionService, CouponLine } from '../../coupon/coupon-redemption.service';
import { addMoney, multiplyMoney, round2 } from '../../../common/utils/money';
import { Product } from '../../product/entities/product.entity';
import { Sku } from '../../sku/entities/sku.entity';
import { ProductMediaService } from 'src/modules/product/product-media.service';
import { MediaService } from 'src/modules/media/services/media.service';
import { AttributeValue } from 'src/modules/attribute/entities/attribute-value.entity';

/** Per-line snapshot data resolved from the priced cart (pre tax/discount). */
interface CheckoutLine {
  product: Product;
  sku: Sku;
  quantity: number;
  unitBasePrice: number;
  unitPrice: number;
  sourceSaleId: string | null;
  lineTotal: number;
  imageUrl: string | null;
  variant: Record<string, string> | null;
}

/** A checkout line after discount allocation + tax extraction. */
interface CheckoutItem extends CheckoutLine {
  discountAllocated: number;
  taxAmount: number;
  taxRateLabel: string | null;
  finalLineTotal: number;
}

interface ShippingResolution {
  shippingCost: number;
  pickupLocationId: string | null;
  pickupSnapshot: Record<string, unknown> | null;
  country: string | undefined;
}

interface CouponResolution {
  discountTotal: number;
  couponId: string | null;
  couponCode: string | null;
  shippingCost: number;
}

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(AttributeValue) private readonly valueRepo: Repository<AttributeValue>,
    private readonly status: OrderStatusService,
    private readonly cart: CartService,
    private readonly pricing: CartPricingService,
    private readonly products: ProductService,
    private readonly skus: SkuService,
    private readonly inventory: InventoryService,
    private readonly sales: SaleResolverService,
    private readonly tax: TaxCalculatorService,
    private readonly shipping: ShippingCalculatorService,
    private readonly pickups: PickupService,
    private readonly categories: CategoryService,
    private readonly coupons: CouponRedemptionService,
    private readonly dataSource: DataSource,
    private readonly media: MediaService,
    private readonly productMedia: ProductMediaService,
    private readonly events: EventEmitter2,
  ) {}

  async checkout(userId: string, dto: CheckoutDto, idempotencyKey?: string): Promise<Order> {
    if (idempotencyKey) {
      const existing = await this.orderRepo.findOne({ where: { idempotencyKey } });
      if (existing) return existing;
    }

    const cart = await this.cart.getActiveForUser(userId);
    const priced = await this.pricing.price(cart);
    this.assertPurchasable(priced);

    const lineData = await this.buildLineData(priced.items);
    const subtotal = addMoney(...lineData.map((l) => l.lineTotal));

    const ship = await this.resolveShipping(dto, subtotal);
    const coupon = await this.applyCoupon(dto, userId, subtotal, lineData, ship.shippingCost);
    const { itemsData, taxTotal } = await this.allocateDiscountAndTax(
      lineData,
      subtotal,
      coupon.discountTotal,
      ship.country ?? 'NP',
    );

    const grandTotal = round2(subtotal - coupon.discountTotal + coupon.shippingCost);
    const saleSavings = addMoney(
      ...itemsData.map((l) => round2((l.unitBasePrice - l.unitPrice) * l.quantity)),
    );

    const placed = await this.persistOrder({
      userId,
      dto,
      idempotencyKey,
      cartId: cart.id,
      itemsData,
      pickup: { id: ship.pickupLocationId, snapshot: ship.pickupSnapshot },
      totals: {
        subtotal,
        discountTotal: coupon.discountTotal,
        shippingCost: coupon.shippingCost,
        taxTotal,
        saleSavings,
        grandTotal,
      },
      coupon: { id: coupon.couponId, code: coupon.couponCode },
    });

    // Notify admins of the new order (the customer who placed it is not self-notified).
    emitNotification(this.events, {
      type: NotificationType.ORDER_PLACED,
      actorId: userId,
      actorType: NotificationActorType.CUSTOMER,
      order: { id: placed.id, orderNumber: placed.orderNumber, userId: placed.userId },
    });
    return placed;
  }

  /** Cart must be non-empty and every line in stock + available. */
  private assertPurchasable(priced: PricedCart): void {
    if (!priced.items.length) throw new BadRequestException('Cart is empty');
    const unavailable = priced.items.filter((l) => l.unavailable || !l.inStock);
    if (unavailable.length) {
      throw new ConflictException({
        code: 'INSUFFICIENT_STOCK',
        message: 'Some items are unavailable',
        details: unavailable.map((l) => l.skuId),
      });
    }
  }

  /** Resolve per-line snapshot data (price, sale source, product, variant, image). */
  private async buildLineData(items: PricedCartLine[]): Promise<CheckoutLine[]> {
    const lineData: CheckoutLine[] = [];
    for (const line of items) {
      const product = await this.products.findOneByIdOrSlug(line.productId, false);
      const sku = await this.skus.findOne(line.skuId);
      const media = sku.imageMediaId
        ? await this.media.findOne(sku.imageMediaId)
        : await this.productMedia.getPrimaryMedia(product.id);
      const skuAttributeValueIds = await this.skus.comboOf(sku.id);
      const skuAttributes = skuAttributeValueIds.length
        ? await this.valueRepo.find({
            where: { id: In(skuAttributeValueIds) },
            relations: ['attribute'],
          })
        : [];
      const variant: Record<string, string> | null = skuAttributes.length
        ? Object.fromEntries(skuAttributes.map((sav) => [sav.attribute.name, sav.value]))
        : null;
      const resolved = await this.sales.resolveForProduct(product.id, sku.price);
      lineData.push({
        product,
        sku,
        quantity: line.quantity,
        unitBasePrice: sku.price,
        unitPrice: resolved.salePrice,
        sourceSaleId: resolved.sourceSaleId,
        lineTotal: multiplyMoney(resolved.salePrice, line.quantity),
        imageUrl: media?.url ?? null,
        variant,
      });
    }
    return lineData;
  }

  /** Validate fulfillment + compute the shipping cost (pickup snapshot when applicable). */
  private async resolveShipping(dto: CheckoutDto, subtotal: number): Promise<ShippingResolution> {
    const country =
      dto.fulfillmentMethod === FulfillmentMethod.DELIVERY
        ? dto.shippingAddress?.countryCode
        : undefined;
    if (dto.fulfillmentMethod === FulfillmentMethod.DELIVERY && !dto.shippingAddress) {
      throw new BadRequestException('Shipping address is required for delivery');
    }

    let pickupSnapshot: Record<string, unknown> | null = null;
    let pickupLocationId: string | null = null;
    if (dto.fulfillmentMethod === FulfillmentMethod.PICKUP) {
      const store = await this.pickups.getActive();
      if (!store) throw new ConflictException('No active pickup location');
      pickupLocationId = store.id;
      pickupSnapshot = {
        name: store.name,
        line1: store.line1,
        city: store.city,
        phone: store.phone,
      };
    }

    const quote = await this.shipping.calculate(
      dto.fulfillmentMethod === FulfillmentMethod.PICKUP
        ? ShippingMethod.PICKUP
        : ShippingMethod.DELIVERY,
      subtotal,
      country,
      dto.shippingAddress?.region,
    );
    return { shippingCost: quote.shippingCost, pickupLocationId, pickupSnapshot, country };
  }

  /** Validate the coupon (if any) against the lines; free-shipping coupons zero the shipping cost. */
  private async applyCoupon(
    dto: CheckoutDto,
    userId: string,
    subtotal: number,
    lineData: CheckoutLine[],
    shippingCost: number,
  ): Promise<CouponResolution> {
    if (!dto.couponCode) {
      return { discountTotal: 0, couponId: null, couponCode: null, shippingCost };
    }
    const couponLines: CouponLine[] = [];
    for (const l of lineData) {
      const ancestors = await this.categories.ancestors(l.product.categoryId).catch(() => []);
      couponLines.push({
        productId: l.product.id,
        categoryLineage: [l.product.categoryId, ...ancestors.map((c) => c.id)],
        lineTotal: l.lineTotal,
      });
    }
    const result = await this.coupons.validateOrThrow(dto.couponCode, {
      userId,
      subtotal,
      lines: couponLines,
    });
    return {
      discountTotal: result.discountAmount,
      couponId: result.coupon.id,
      couponCode: result.coupon.code,
      shippingCost: result.freeShipping ? 0 : shippingCost,
    };
  }

  /** Allocate the discount proportionally by line share, then extract per-line tax. */
  private async allocateDiscountAndTax(
    lineData: CheckoutLine[],
    subtotal: number,
    discountTotal: number,
    taxCountry: string,
  ): Promise<{ itemsData: CheckoutItem[]; taxTotal: number }> {
    let taxTotal = 0;
    const itemsData: CheckoutItem[] = [];
    for (const l of lineData) {
      const share = subtotal > 0 ? l.lineTotal / subtotal : 0;
      const discountAllocated = round2(discountTotal * share);
      const taxableBase = round2(l.lineTotal - discountAllocated);
      const lineTax = await this.tax.extractLineTax(taxableBase, l.product.taxClassId, taxCountry);
      taxTotal = addMoney(taxTotal, lineTax.tax);
      itemsData.push({
        ...l,
        discountAllocated,
        taxAmount: lineTax.tax,
        taxRateLabel: lineTax.label,
        finalLineTotal: taxableBase,
      });
    }
    return { itemsData, taxTotal };
  }

  /** Reserve stock, persist the order + items + status + coupon redemption, mark cart converted — atomically. */
  private persistOrder(p: {
    userId: string;
    dto: CheckoutDto;
    idempotencyKey?: string;
    cartId: string;
    itemsData: CheckoutItem[];
    pickup: { id: string | null; snapshot: Record<string, unknown> | null };
    totals: {
      subtotal: number;
      discountTotal: number;
      shippingCost: number;
      taxTotal: number;
      saleSavings: number;
      grandTotal: number;
    };
    coupon: { id: string | null; code: string | null };
  }): Promise<Order> {
    const { userId, dto, idempotencyKey, cartId, itemsData, pickup, totals, coupon } = p;
    return this.dataSource.transaction(async (mgr) => {
      // Reserve stock for each line (locked).
      for (const l of itemsData) {
        await this.inventory.reserve(l.sku.id, l.quantity, { refType: 'order' }, mgr);
      }

      const seq = await mgr.query(`SELECT nextval('order_number_seq') AS n`);
      const n = String(seq[0].n).padStart(6, '0');
      const orderNumber = `BT-${new Date().getFullYear()}-${n}`;

      const order = await mgr.getRepository(Order).save(
        mgr.getRepository(Order).create({
          orderNumber,
          userId,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.UNPAID,
          fulfillmentMethod: dto.fulfillmentMethod,
          paymentMethod: dto.paymentMethod,
          shippingAddress: dto.shippingAddress ? this.snapshot(dto.shippingAddress) : null,
          billingAddress: dto.billingAddress
            ? this.snapshot(dto.billingAddress)
            : dto.shippingAddress
              ? this.snapshot(dto.shippingAddress)
              : null,
          pickupLocationId: pickup.id,
          pickupLocation: pickup.snapshot,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          couponId: coupon.id,
          couponCode: coupon.code,
          shippingCost: totals.shippingCost,
          taxTotal: totals.taxTotal,
          saleSavings: totals.saleSavings,
          grandTotal: totals.grandTotal,
          customerNote: dto.customerNote ?? null,
          idempotencyKey: idempotencyKey ?? null,
          placedAt: new Date(),
        }),
      );

      const items = itemsData.map((l) =>
        mgr.getRepository(OrderItem).create({
          orderId: order.id,
          skuId: l.sku.id,
          productId: l.product.id,
          productName: l.sku.name || l.product.name,
          skuCode: l.sku.sku,
          variant: l.variant,
          imageUrl: l.imageUrl,
          unitBasePrice: l.unitBasePrice,
          unitPrice: l.unitPrice,
          sourceSaleId: l.sourceSaleId,
          quantity: l.quantity,
          discountAllocated: l.discountAllocated,
          taxAmount: l.taxAmount,
          taxRateLabel: l.taxRateLabel,
          lineTotal: l.finalLineTotal,
        }),
      );
      await mgr.getRepository(OrderItem).save(items);
      await this.status.record(mgr, order.id, OrderStatus.PENDING, 'Order placed', userId);

      if (coupon.id) {
        await this.coupons.redeem(coupon.id, userId, order.id, totals.discountTotal, mgr);
      }
      await mgr.update('carts', { id: cartId }, { status: 'CONVERTED' });

      return mgr.getRepository(Order).findOneOrFail({ where: { id: order.id } });
    });
  }

  private snapshot(a: AddressInputDto): AddressSnapshot {
    return {
      recipientName: a.recipientName,
      phone: a.phone,
      email: a.email ?? null,
      line1: a.line1,
      line2: a.line2 ?? null,
      city: a.city,
      region: a.region ?? null,
      countryCode: a.countryCode.toUpperCase(),
      postalCode: a.postalCode ?? null,
      nearestLandmark: a.nearestLandmark ?? null,
    };
  }
}
