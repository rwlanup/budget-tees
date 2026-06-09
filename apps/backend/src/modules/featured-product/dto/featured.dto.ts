import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class AddFeaturedDto {
  @IsUUID() productId: string;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateFeaturedDto {
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class ReorderFeaturedItemDto {
  @IsUUID() id: string;
  @IsInt() sortOrder: number;
}

export class ReorderFeaturedDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderFeaturedItemDto)
  items: ReorderFeaturedItemDto[];
}
