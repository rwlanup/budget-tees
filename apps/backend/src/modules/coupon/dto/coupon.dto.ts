import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { CouponAppliesTo, CouponType } from '../enums/coupon.enums';

export class CreateCouponDto {
  @IsString() @Length(3, 40) @Matches(/^[A-Za-z0-9_-]+$/) code: string;
  @IsOptional() @IsString() @Length(0, 255) description?: string;
  @IsEnum(CouponType) type: CouponType;
  @IsOptional() @IsNumber() @Min(0) value?: number;
  @IsOptional() @IsNumber() @Min(0) maxDiscountAmount?: number;
  @IsOptional() @IsNumber() @Min(0) minOrderAmount?: number;
  @IsEnum(CouponAppliesTo) appliesTo: CouponAppliesTo;
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) productIds?: string[];
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) categoryIds?: string[];
  @IsOptional() @IsBoolean() firstOrderOnly?: boolean;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) usageLimitPerUser?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateCouponDto {
  @IsOptional() @IsString() @Length(0, 255) description?: string;
  @IsOptional() @IsNumber() @Min(0) value?: number;
  @IsOptional() @IsNumber() @Min(0) maxDiscountAmount?: number;
  @IsOptional() @IsNumber() @Min(0) minOrderAmount?: number;
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) productIds?: string[];
  @IsOptional() @IsArray() @ArrayUnique() @IsUUID('4', { each: true }) categoryIds?: string[];
  @IsOptional() @IsBoolean() firstOrderOnly?: boolean;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) usageLimitPerUser?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ValidateCouponDto {
  @IsString() code: string;
}

export class ListCouponQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
