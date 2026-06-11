import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { OrderService } from '../services/order.service';
import { InvoiceService } from '../services/invoice.service';
import { sendInvoice } from './order.controller';
import { FulfillmentDto, ListOrdersQueryDto, UpdateOrderStatusDto } from '../dto/order-admin.dto';

@Controller('admin/orders')
@Permissions(PERMISSIONS.ORDER_MANAGE)
export class AdminOrderController {
  constructor(
    private readonly orders: OrderService,
    private readonly invoices: InvoiceService,
  ) {}

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

  @Get(':id/invoice')
  async invoice(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const order = await this.orders.adminFindOne(id);
    const pdf = await this.invoices.generate(order);
    sendInvoice(res, order.orderNumber, pdf);
  }
}
