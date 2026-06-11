import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { CheckoutService } from '../services/checkout.service';
import { OrderService } from '../services/order.service';
import { InvoiceService } from '../services/invoice.service';
import { CheckoutDto } from '../dto/checkout.dto';
import { ListOrdersQueryDto } from '../dto/order-admin.dto';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly checkout: CheckoutService,
    private readonly orders: OrderService,
    private readonly invoices: InvoiceService,
  ) {}

  @Post('checkout')
  @Permissions(PERMISSIONS.ORDER_CREATE_OWN)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  place(
    @CurrentUser('id') userId: string,
    @CurrentUser('roleName') roleName: string,
    @Body() dto: CheckoutDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    // Storefront-only action: staff/admin accounts cannot place orders.
    if (roleName !== 'customer') {
      throw new ForbiddenException('Admin accounts cannot place orders');
    }
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

  @Get(':idOrNumber/invoice')
  @Permissions(PERMISSIONS.ORDER_READ_OWN)
  async invoice(
    @CurrentUser('id') userId: string,
    @Param('idOrNumber') idOrNumber: string,
    @Res() res: Response,
  ) {
    const order = await this.orders.findOneForUser(userId, idOrNumber);
    const pdf = await this.invoices.generate(order);
    sendInvoice(res, order.orderNumber, pdf);
  }
}

/** Stream a PDF buffer as an attachment download. */
export function sendInvoice(res: Response, orderNumber: string, pdf: Buffer): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${orderNumber}.pdf"`);
  res.setHeader('Content-Length', pdf.length);
  res.end(pdf);
}
