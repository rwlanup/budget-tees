import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class WishlistProductDto {
  @IsUUID()
  productId: string;
}

export class MoveToCartDto {
  @IsUUID()
  skuId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;

  @IsOptional()
  @IsBoolean()
  removeFromWishlist?: boolean;
}
