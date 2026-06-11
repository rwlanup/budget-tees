import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class WishlistItemDto {
  @IsUUID()
  skuId: string;
}

export class MoveToCartDto {
  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;

  @IsOptional()
  @IsBoolean()
  removeFromWishlist?: boolean;
}
