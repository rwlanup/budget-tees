import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsISO31661Alpha2,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { IsAllowedPhoneNumber } from '../../../common/decorators/is-allowed-phone-number.decorator';
import { FulfillmentMethod, PaymentMethod } from '../enums/order.enums';

export class AddressInputDto {
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
}

export class CheckoutDto {
  @IsEnum(FulfillmentMethod) fulfillmentMethod: FulfillmentMethod;
  @IsEnum(PaymentMethod) paymentMethod: PaymentMethod;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressInputDto)
  shippingAddress?: AddressInputDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressInputDto)
  billingAddress?: AddressInputDto;

  @IsOptional() @IsUUID() pickupLocationId?: string;

  @IsEmail() contactEmail: string;
  @IsAllowedPhoneNumber() contactPhone: string;

  @IsOptional() @IsString() @Length(3, 40) couponCode?: string;
  @IsOptional() @IsString() @Length(0, 500) customerNote?: string;
}
