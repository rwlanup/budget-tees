import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { WishlistService } from './wishlist.service';
import { MoveToCartDto, WishlistItemDto } from './dto/wishlist.dto';

@Controller('wishlist')
@Permissions(PERMISSIONS.WISHLIST_MANAGE_OWN)
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.wishlist.list(userId);
  }

  @Post('items')
  add(@CurrentUser('id') userId: string, @Body() dto: WishlistItemDto) {
    return this.wishlist.add(userId, dto.skuId);
  }

  @Post('toggle')
  toggle(@CurrentUser('id') userId: string, @Body() dto: WishlistItemDto) {
    return this.wishlist.toggle(userId, dto.skuId);
  }

  @Get('contains/:skuId')
  contains(@CurrentUser('id') userId: string, @Param('skuId', ParseUUIDPipe) skuId: string) {
    return this.wishlist.contains(userId, skuId);
  }

  @Post('items/:skuId/move-to-cart')
  moveToCart(
    @CurrentUser('id') userId: string,
    @Param('skuId', ParseUUIDPipe) skuId: string,
    @Body() dto: MoveToCartDto,
  ) {
    return this.wishlist.moveToCart(userId, skuId, dto.quantity, dto.removeFromWishlist ?? true);
  }

  @Delete('items/:skuId')
  remove(@CurrentUser('id') userId: string, @Param('skuId', ParseUUIDPipe) skuId: string) {
    return this.wishlist.remove(userId, skuId);
  }
}
