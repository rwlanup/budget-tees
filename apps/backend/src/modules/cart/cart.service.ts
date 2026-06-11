import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartStatus } from './enums/cart-status.enum';
import { CartPricingService, PricedCart } from './cart-pricing.service';
import { SkuService } from '../sku/services/sku.service';
import { ProductService } from '../product/product.service';
import { AddItemDto, MAX_PER_ITEM } from './dto/cart.dto';

export interface CartContext {
  userId?: string;
  token?: string;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private readonly itemRepo: Repository<CartItem>,
    private readonly pricing: CartPricingService,
    private readonly skus: SkuService,
    private readonly products: ProductService,
  ) {}

  /** Resolve (or create) the caller's active cart. Returns the cart and the token to echo back. */
  async resolveOrCreate(ctx: CartContext): Promise<{ cart: Cart; token: string | null }> {
    if (ctx.userId) {
      let cart = await this.cartRepo.findOne({
        where: { userId: ctx.userId, status: CartStatus.ACTIVE },
      });
      if (!cart) cart = await this.cartRepo.save(this.cartRepo.create({ userId: ctx.userId }));
      return { cart, token: null };
    }
    if (ctx.token) {
      const cart = await this.cartRepo.findOne({
        where: { token: ctx.token, status: CartStatus.ACTIVE },
      });
      if (cart) return { cart, token: ctx.token };
    }
    const token = randomBytes(32).toString('hex');
    const cart = await this.cartRepo.save(this.cartRepo.create({ token }));
    return { cart, token };
  }

  async getPriced(ctx: CartContext): Promise<PricedCart & { token: string | null }> {
    const { cart, token } = await this.resolveOrCreate(ctx);
    const priced = await this.pricing.price(await this.reload(cart.id));
    return { ...priced, token };
  }

  async addItem(ctx: CartContext, dto: AddItemDto): Promise<PricedCart & { token: string | null }> {
    const { cart, token } = await this.resolveOrCreate(ctx);
    const sku = await this.skus.findOne(dto.skuId);
    if (!sku.isActive) throw new ConflictException('SKU is not available');
    await this.products.findOneByIdOrSlug(sku.productId, true); // ensures published

    const existing = await this.itemRepo.findOne({ where: { cartId: cart.id, skuId: dto.skuId } });
    const newQty = Math.min((existing?.quantity ?? 0) + dto.quantity, MAX_PER_ITEM);
    if (existing) {
      existing.quantity = newQty;
      await this.itemRepo.save(existing);
    } else {
      await this.itemRepo.save(
        this.itemRepo.create({ cartId: cart.id, skuId: dto.skuId, quantity: newQty }),
      );
    }
    await this.touch(cart.id);
    return { ...(await this.pricing.price(await this.reload(cart.id))), token };
  }

  async updateItem(ctx: CartContext, itemId: string, quantity: number) {
    const { cart, token } = await this.resolveOrCreate(ctx);
    const item = await this.itemRepo.findOne({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new NotFoundException('Cart item not found');
    item.quantity = Math.min(quantity, MAX_PER_ITEM);
    await this.itemRepo.save(item);
    await this.touch(cart.id);
    return { ...(await this.pricing.price(await this.reload(cart.id))), token };
  }

  async removeItem(ctx: CartContext, itemId: string) {
    const { cart, token } = await this.resolveOrCreate(ctx);
    await this.itemRepo.delete({ id: itemId, cartId: cart.id });
    await this.touch(cart.id);
    return { ...(await this.pricing.price(await this.reload(cart.id))), token };
  }

  async clear(ctx: CartContext) {
    const { cart, token } = await this.resolveOrCreate(ctx);
    await this.itemRepo.delete({ cartId: cart.id });
    return { ...(await this.pricing.price(await this.reload(cart.id))), token };
  }

  /** Merge a guest cart (by token) into the user's active cart on login. */
  async merge(userId: string, token: string): Promise<PricedCart> {
    const guest = await this.cartRepo.findOne({ where: { token, status: CartStatus.ACTIVE } });
    const { cart: userCart } = await this.resolveOrCreate({ userId });
    if (guest && guest.id !== userCart.id) {
      for (const item of guest.items ?? []) {
        const existing = await this.itemRepo.findOne({
          where: { cartId: userCart.id, skuId: item.skuId },
        });
        const qty = Math.min((existing?.quantity ?? 0) + item.quantity, MAX_PER_ITEM);
        if (existing) {
          existing.quantity = qty;
          await this.itemRepo.save(existing);
        } else {
          await this.itemRepo.save(
            this.itemRepo.create({ cartId: userCart.id, skuId: item.skuId, quantity: qty }),
          );
        }
      }
      guest.status = CartStatus.MERGED;
      await this.cartRepo.save(guest);
    }
    return this.pricing.price(await this.reload(userCart.id));
  }

  /** Order checkout: load the active cart entity for a user. */
  async getActiveForUser(userId: string): Promise<Cart> {
    const cart = await this.cartRepo.findOne({ where: { userId, status: CartStatus.ACTIVE } });
    if (!cart || !cart.items?.length) throw new BadRequestException('Cart is empty');
    return cart;
  }

  async markConverted(cartId: string): Promise<void> {
    await this.cartRepo.update(cartId, { status: CartStatus.CONVERTED });
  }

  private reload(id: string): Promise<Cart> {
    return this.cartRepo.findOne({ where: { id } }) as Promise<Cart>;
  }

  private touch(cartId: string): Promise<unknown> {
    return this.cartRepo.update(cartId, { lastActivityAt: new Date() });
  }
}
