import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CartService, CartContext } from './cart.service';
import { AddItemDto, MergeCartDto, UpdateItemDto } from './dto/cart.dto';

const CART_TOKEN_HEADER = 'x-cart-token';

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  private ctx(userId?: string, token?: string): CartContext {
    return { userId, token };
  }

  @Get()
  @OptionalAuth()
  get(@CurrentUser('id') userId?: string, @Headers(CART_TOKEN_HEADER) token?: string) {
    return this.cart.getPriced(this.ctx(userId, token));
  }

  @Post('items')
  @OptionalAuth()
  addItem(
    @Body() dto: AddItemDto,
    @CurrentUser('id') userId?: string,
    @Headers(CART_TOKEN_HEADER) token?: string,
  ) {
    return this.cart.addItem(this.ctx(userId, token), dto);
  }

  @Patch('items/:itemId')
  @OptionalAuth()
  updateItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateItemDto,
    @CurrentUser('id') userId?: string,
    @Headers(CART_TOKEN_HEADER) token?: string,
  ) {
    return this.cart.updateItem(this.ctx(userId, token), itemId, dto.quantity);
  }

  @Delete('items/:itemId')
  @OptionalAuth()
  removeItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser('id') userId?: string,
    @Headers(CART_TOKEN_HEADER) token?: string,
  ) {
    return this.cart.removeItem(this.ctx(userId, token), itemId);
  }

  @Delete()
  @OptionalAuth()
  clear(@CurrentUser('id') userId?: string, @Headers(CART_TOKEN_HEADER) token?: string) {
    return this.cart.clear(this.ctx(userId, token));
  }

  @Post('merge')
  merge(@CurrentUser('id') userId: string, @Body() dto: MergeCartDto) {
    return this.cart.merge(userId, dto.token);
  }
}
