import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DataSource, In, Repository } from 'typeorm';
import { emitNotification } from '../../notification/notification-event';
import { NotificationActorType, NotificationType } from '../../notification/enums/notification.enums';
import { Order, AddressSnapshot } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { FulfillmentMethod, OrderStatus, PaymentStatus } from '../enums/order.enums';
import { OrderStatusService } from './order-status.service';
import { CheckoutDto, AddressInputDto } from '../dto/checkout.dto';
import { CartService } from '../../cart/cart.service';
import { CartPricingService } from '../../cart/cart-pricing.service';
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
    if (!priced.items.length) throw new BadRequestException('Cart is empty');
    const unavailable = priced.items.filter((l) => l.unavailable || !l.inStock);
    if (unavailable.length) {
      throw new ConflictException({
        code: 'INSUFFICIENT_STOCK',
        message: 'Some items are unavailable',
        details: unavailable.map((l) => l.skuId),
      });
    }

    // Resolve per-line snapshot data (price, sale source, product, tax class).
    const lineData: Array<{
      product: Product;
      sku: Sku;
      quantity: number;
      unitBasePrice: number;
      unitPrice: number;
      sourceSaleId: string | null;
      lineTotal: number;
      imageUrl: string | null;
      variant: Record<string, string> | null;
    }> = [];
    for (const line of priced.items) {
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
      const lineTotal = multiplyMoney(resolved.salePrice, line.quantity);
      lineData.push({
        product,
        sku,
        quantity: line.quantity,
        unitBasePrice: sku.price,
        unitPrice: resolved.salePrice,
        sourceSaleId: resolved.sourceSaleId,
        lineTotal,
        imageUrl: media?.url ?? null,
        variant: variant,
      });
    }

    const subtotal = addMoney(...lineData.map((l) => l.lineTotal));

    // Shipping.
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
    const shippingQuote = await this.shipping.calculate(
      dto.fulfillmentMethod === FulfillmentMethod.PICKUP
        ? ShippingMethod.PICKUP
        : ShippingMethod.DELIVERY,
      subtotal,
      country,
      dto.shippingAddress?.region,
    );
    let shippingCost = shippingQuote.shippingCost;

    // Coupon.
    let discountTotal = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;
    if (dto.couponCode) {
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
      discountTotal = result.discountAmount;
      couponId = result.coupon.id;
      couponCode = result.coupon.code;
      if (result.freeShipping) shippingCost = 0;
    }

    // Allocate discount proportionally by line share of subtotal.
    const taxCountry = country ?? 'NP';
    let taxTotal = 0;
    const itemsData: Array<{
      product: Product;
      sku: Sku;
      quantity: number;
      unitBasePrice: number;
      unitPrice: number;
      sourceSaleId: string | null;
      lineTotal: number;
      discountAllocated: number;
      taxAmount: number;
      taxRateLabel: string | null;
      finalLineTotal: number;
      imageUrl: string | null;
      variant: Record<string, string> | null;
    }> = [];
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

    const grandTotal = round2(subtotal - discountTotal + shippingCost);
    const saleSavings = addMoney(
      ...itemsData.map((l) => round2((l.unitBasePrice - l.unitPrice) * l.quantity)),
    );

    const placed = await this.dataSource.transaction(async (mgr) => {
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
          pickupLocationId,
          pickupLocation: pickupSnapshot,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          subtotal,
          discountTotal,
          couponId,
          couponCode,
          shippingCost,
          taxTotal,
          saleSavings,
          grandTotal,
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

      if (couponId) {
        await this.coupons.redeem(couponId, userId, order.id, discountTotal, mgr);
      }
      await mgr.update('carts', { id: cart.id }, { status: 'CONVERTED' });

      return mgr.getRepository(Order).findOneOrFail({ where: { id: order.id } });
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
