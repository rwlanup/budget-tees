import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { PaymentService } from './payment.service';
import { RefundService } from './refund.service';
import { InitiatePaymentDto, RefundDto } from './dto/payment.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post('initiate')
  @Permissions(PERMISSIONS.ORDER_CREATE_OWN)
  initiate(
    @CurrentUser('id') userId: string,
    @Body() dto: InitiatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.payments.initiate(userId, dto.orderId, dto.method, idempotencyKey);
  }

  @Get(':id/status')
  @Permissions(PERMISSIONS.ORDER_READ_OWN)
  status(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.statusForUser(userId, id);
  }

  /** Active eSewa status reconcile for an order (used by the result page while settling). */
  @Get('order/:idOrNumber/status')
  @Permissions(PERMISSIONS.ORDER_READ_OWN)
  orderStatus(@CurrentUser('id') userId: string, @Param('idOrNumber') idOrNumber: string) {
    return this.payments.reconcileOrderPayment(userId, idOrNumber);
  }
}

@Controller('payments')
export class PaymentWebhookController {
  constructor(
    private readonly payments: PaymentService,
    private readonly config: ConfigService,
  ) {}

  /**
   * eSewa ePay v2 success/failure redirect (browser GET). Verify the signed `data`, settle the
   * payment, then redirect the shopper to the storefront result page.
   */
  @Get('esewa/callback')
  @Public()
  async esewa(@Query() query: Record<string, unknown>, @Res() res: Response) {
    const base = this.config.get<string>('payment.websiteUrl') ?? 'http://localhost:3000';
    const failedOrderParam = typeof query.order === 'string' ? `&order=${encodeURIComponent(query.order)}` : '';
    let url = `${base}/checkout/result?status=failed${failedOrderParam}`;
    try {
      const result = await this.payments.handleCallback(query);
      const status = result.success ? 'success' : 'failed';
      const orderParam = result.orderNumber
        ? `&order=${encodeURIComponent(result.orderNumber)}`
        : '';
      url = `${base}/checkout/result?status=${status}${orderParam}`;
    } catch {
      // verification/lookup failed — fall through to the failed result page.
    }
    res.redirect(url);
  }
}

@Controller('admin/payments')
@Permissions(PERMISSIONS.PAYMENT_MANAGE)
export class AdminPaymentController {
  constructor(
    private readonly payments: PaymentService,
    private readonly refunds: RefundService,
  ) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.payments.adminList(query);
  }

  @Post(':id/refund')
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.refunds.refund(id, dto, adminId);
  }

  @Post('order/:orderId/mark-paid')
  async markPaid(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @CurrentUser('id') adminId: string,
  ) {
    await this.payments.markOrderPaid(orderId, adminId);
    return { paid: true };
  }
}
