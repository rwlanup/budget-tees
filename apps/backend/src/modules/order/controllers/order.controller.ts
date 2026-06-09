import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { CheckoutService } from '../services/checkout.service';
import { OrderService } from '../services/order.service';
import { CheckoutDto } from '../dto/checkout.dto';
import { ListOrdersQueryDto } from '../dto/order-admin.dto';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly checkout: CheckoutService,
    private readonly orders: OrderService,
  ) {}

  @Post('checkout')
  @Permissions(PERMISSIONS.ORDER_CREATE_OWN)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  place(
    @CurrentUser('id') userId: string,
    @Body() dto: CheckoutDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.checkout.checkout(userId, dto, idempotencyKey);
  }

  @Get()
  @Permissions(PERMISSIONS.ORDER_READ_OWN)
  list(@CurrentUser('id') userId: string, @Query() query: ListOrdersQueryDto) {
    return this.orders.findForUser(userId, query);
  }

  @Get(':idOrNumber')
  @Permissions(PERMISSIONS.ORDER_READ_OWN)
  findOne(@CurrentUser('id') userId: string, @Param('idOrNumber') idOrNumber: string) {
    return this.orders.findOneForUser(userId, idOrNumber);
  }

  @Post(':idOrNumber/cancel')
  @Permissions(PERMISSIONS.ORDER_READ_OWN)
  cancel(@CurrentUser('id') userId: string, @Param('idOrNumber') idOrNumber: string) {
    return this.orders.cancel(userId, idOrNumber);
  }
}
