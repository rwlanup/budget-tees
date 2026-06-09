import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class GenerateSkusDto {
  @IsOptional() @IsNumber() @Min(0) defaultPrice?: number;
  @IsOptional() @IsInt() @Min(0) defaultStock?: number;
  @IsOptional() @IsString() skuCodePrefix?: string;
}

export class CreateSkuDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  attributeValueIds: string[];

  @IsOptional() @IsString() @Length(1, 64) sku?: string;
  @IsOptional() @IsString() @Length(1, 64) barcode?: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsNumber() @Min(0) compareAtPrice?: number;
  @IsOptional() @IsNumber() @Min(0) costPrice?: number;
  @IsOptional() @IsInt() @Min(0) stock?: number;
  @IsOptional() @IsInt() @Min(0) lowStockThreshold?: number;
  @IsOptional() @IsBoolean() allowBackorder?: boolean;
  @IsOptional() @IsInt() @Min(0) weightGrams?: number;
  @IsOptional() @IsUUID() imageMediaId?: string;
}

export class UpdateSkuDto {
  @IsOptional() @IsString() @Length(1, 64) sku?: string;
  @IsOptional() @IsString() @Length(1, 64) barcode?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsNumber() @Min(0) compareAtPrice?: number;
  @IsOptional() @IsNumber() @Min(0) costPrice?: number;
  @IsOptional() @IsInt() @Min(0) lowStockThreshold?: number;
  @IsOptional() @IsBoolean() allowBackorder?: boolean;
  @IsOptional() @IsInt() @Min(0) weightGrams?: number;
  @IsOptional() @IsUUID() imageMediaId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class AdjustStockDto {
  @IsOptional() @IsInt() delta?: number;
  @IsOptional() @IsInt() @Min(0) setTo?: number;
  @IsString() @Length(1, 255) reason: string;
}
