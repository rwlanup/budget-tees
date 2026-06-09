import { IsInt, IsString, IsUUID, Max, Min } from 'class-validator';

export const MAX_PER_ITEM = 99;

export class AddItemDto {
  @IsUUID()
  skuId: string;

  @IsInt()
  @Min(1)
  @Max(MAX_PER_ITEM)
  quantity: number;
}

export class UpdateItemDto {
  @IsInt()
  @Min(1)
  @Max(MAX_PER_ITEM)
  quantity: number;
}

export class MergeCartDto {
  @IsString()
  token: string;
}
