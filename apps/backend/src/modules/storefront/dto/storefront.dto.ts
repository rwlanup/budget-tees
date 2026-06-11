import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

/** Variant-first catalog listing query (rooted on active SKUs of published products). */
export class StorefrontVariantQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() brandId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  tagIds?: string[];

  /** Filter SKUs whose combo includes ANY of these attribute-value ids (e.g. size/colour). */
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value])) // Ensure it's always an array
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  attributeValueIds?: string[];

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) priceMin?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) priceMax?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc', 'name'])
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name';
}
