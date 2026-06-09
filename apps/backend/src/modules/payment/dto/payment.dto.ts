import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { PaymentMethod } from '../../order/enums/order.enums';

export class InitiatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

export class RefundDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @Length(1, 255)
  reason: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  externalRef?: string;
}

export class MarkPaidDto {
  @IsOptional() @IsString() @Length(0, 120) reference?: string;
  @IsOptional() @IsString() @Length(0, 255) note?: string;
}
