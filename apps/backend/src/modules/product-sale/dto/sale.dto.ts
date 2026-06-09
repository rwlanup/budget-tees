import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { SaleScope, SaleType } from '../enums/sale.enums';

export class CreateSaleDto {
  @IsString() @Length(2, 120) name: string;
  @IsEnum(SaleType) type: SaleType;
  @IsNumber() @Min(0) value: number;
  @IsOptional() @IsNumber() @Min(0) maxDiscountAmount?: number;
  @IsEnum(SaleScope) scope: SaleScope;

  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true })
  productIds?: string[];

  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true })
  categoryIds?: string[];

  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true })
  excludedProductIds?: string[];

  @IsDateString() startsAt: string;
  @IsDateString() endsAt: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateSaleDto {
  @IsOptional() @IsString() @Length(2, 120) name?: string;
  @IsOptional() @IsNumber() @Min(0) value?: number;
  @IsOptional() @IsNumber() @Min(0) maxDiscountAmount?: number;
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) productIds?: string[];
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) categoryIds?: string[];
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) excludedProductIds?: string[];
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ListSaleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  status?: 'active' | 'upcoming' | 'expired';
}
