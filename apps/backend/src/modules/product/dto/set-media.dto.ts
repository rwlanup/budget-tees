import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsUUID, ValidateNested } from 'class-validator';

export class ProductMediaItemDto {
  @IsUUID()
  mediaId: string;

  @IsInt()
  sortOrder: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class SetProductMediaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductMediaItemDto)
  items: ProductMediaItemDto[];
}
