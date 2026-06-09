import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { OrderService } from '../services/order.service';
import { FulfillmentDto, ListOrdersQueryDto, UpdateOrderStatusDto } from '../dto/order-admin.dto';

@Controller('admin/orders')
@Permissions(PERMISSIONS.ORDER_MANAGE)
export class AdminOrderController {
  constructor(private readonly orders: OrderService) {}

  @Get()
  list(@Query() query: ListOrdersQueryDto) {
    return this.orders.adminList(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.adminFindOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.orders.adminUpdateStatus(id, dto, adminId);
  }

  @Patch(':id/fulfillment')
  fulfillment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FulfillmentDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.orders.adminFulfillment(id, dto, adminId);
  }
}
