import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { WishlistService } from './wishlist.service';
import { MoveToCartDto, WishlistProductDto } from './dto/wishlist.dto';

@Controller('wishlist')
@Permissions(PERMISSIONS.WISHLIST_MANAGE_OWN)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.wishlist.list(userId);
  }

  @Post('items')
  add(@CurrentUser('id') userId: string, @Body() dto: WishlistProductDto) {
    return this.wishlist.add(userId, dto.productId);
  }

  @Post('toggle')
  toggle(@CurrentUser('id') userId: string, @Body() dto: WishlistProductDto) {
    return this.wishlist.toggle(userId, dto.productId);
  }

  @Get('contains/:productId')
  contains(@CurrentUser('id') userId: string, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.wishlist.contains(userId, productId);
  }

  @Post('items/:productId/move-to-cart')
  moveToCart(
    @CurrentUser('id') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: MoveToCartDto,
  ) {
    return this.wishlist.moveToCart(
      userId,
      productId,
      dto.skuId,
      dto.quantity,
      dto.removeFromWishlist ?? true,
    );
  }

  @Delete('items/:productId')
  remove(@CurrentUser('id') userId: string, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.wishlist.remove(userId, productId);
  }
}
