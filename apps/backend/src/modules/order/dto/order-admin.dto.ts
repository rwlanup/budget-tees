import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { FulfillmentMethod, OrderStatus, PaymentStatus } from '../enums/order.enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}

export class FulfillmentDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional() @IsString() @Length(0, 80) trackingCarrier?: string;
  @IsOptional() @IsString() @Length(0, 120) trackingNumber?: string;
}

export class ListOrdersQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(OrderStatus) status?: OrderStatus;
  @IsOptional() @IsEnum(PaymentStatus) paymentStatus?: PaymentStatus;
  @IsOptional() @IsEnum(FulfillmentMethod) fulfillmentMethod?: FulfillmentMethod;
  @IsOptional() @IsUUID() userId?: string;
}
