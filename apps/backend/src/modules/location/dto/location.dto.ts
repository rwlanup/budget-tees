import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO31661Alpha2,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { IsAllowedPhoneNumber } from '../../../common/decorators/is-allowed-phone-number.decorator';
import { AddressType, ShippingMethod } from '../enums/location.enums';

export class CreateAddressDto {
  @IsEnum(AddressType) type: AddressType;
  @IsOptional() @IsString() @Length(0, 40) label?: string;
  @IsString() @Length(1, 120) recipientName: string;
  @IsAllowedPhoneNumber() phone: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @Length(1, 180) line1: string;
  @IsOptional() @IsString() @Length(0, 180) line2?: string;
  @IsString() @Length(1, 100) city: string;
  @IsOptional() @IsString() @Length(0, 100) region?: string;
  @IsISO31661Alpha2() countryCode: string;
  @IsOptional() @IsString() @Length(0, 20) postalCode?: string;
  @IsOptional() @IsString() @Length(0, 180) nearestLandmark?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional() @IsEnum(AddressType) type: AddressType;
  @IsOptional() @IsString() @Length(0, 40) label?: string;
  @IsOptional() @IsString() @Length(1, 120) recipientName?: string;
  @IsOptional() @IsAllowedPhoneNumber() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @Length(1, 180) line1?: string;
  @IsOptional() @IsString() @Length(0, 180) line2?: string;
  @IsOptional() @IsString() @Length(1, 100) city?: string;
  @IsOptional() @IsString() @Length(0, 100) region?: string;
  @IsOptional() @IsISO31661Alpha2() countryCode: string;
  @IsOptional() @IsString() @Length(0, 20) postalCode?: string;
  @IsOptional() @IsString() @Length(0, 180) nearestLandmark?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class CreateZoneDto {
  @IsString() @Length(2, 100) name: string;
  @IsISO31661Alpha2() countryCode: string;
  @IsOptional() @IsBoolean() isCountryWide?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) regions?: string[];
  @IsNumber() @Min(0) flatRate: number;
  @IsOptional() @IsNumber() @Min(0) freeShippingThreshold?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() sortOrder?: number;
}

export class UpdateZoneDto {
  @IsOptional() @IsString() @Length(2, 100) name?: string;
  @IsOptional() @IsISO31661Alpha2() countryCode: string;
  @IsOptional() @IsBoolean() isCountryWide?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) regions?: string[];
  @IsOptional() @IsNumber() @Min(0) flatRate?: number;
  @IsOptional() @IsNumber() @Min(0) freeShippingThreshold?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() sortOrder?: number;
}

export class CreatePickupDto {
  @IsString() @Length(2, 120) name: string;
  @IsOptional() @IsAllowedPhoneNumber() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @Length(1, 180) line1: string;
  @IsString() @Length(1, 100) city: string;
  @IsOptional() @IsString() @Length(0, 100) region?: string;
  @IsISO31661Alpha2() countryCode: string;
  @IsOptional() @IsString() @Length(0, 20) postalCode?: string;
  @IsOptional() @IsString() latitude?: string;
  @IsOptional() @IsString() longitude?: string;
  @IsOptional() @IsObject() openingHours?: Record<string, unknown>;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdatePickupDto {
  @IsOptional() @IsString() @Length(2, 120) name?: string;
  @IsOptional() @IsAllowedPhoneNumber() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @Length(1, 180) line1?: string;
  @IsOptional() @IsString() @Length(1, 100) city?: string;
  @IsOptional() @IsString() @Length(0, 100) region?: string;
  @IsOptional() @IsISO31661Alpha2() countryCode: string;
  @IsOptional() @IsString() @Length(0, 20) postalCode?: string;
  @IsOptional() @IsString() latitude?: string;
  @IsOptional() @IsString() longitude?: string;
  @IsOptional() @IsObject() openingHours?: Record<string, unknown>;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ShippingQuoteDto {
  @IsEnum(ShippingMethod) method: ShippingMethod;
  @IsOptional() @IsISO31661Alpha2() countryCode?: string;
  @IsOptional() @IsString() region?: string;
  @IsNumber() @Min(0) subtotal: number;
}
