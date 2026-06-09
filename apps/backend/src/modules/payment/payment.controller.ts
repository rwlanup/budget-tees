import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
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
  initiate(@CurrentUser('id') userId: string, @Body() dto: InitiatePaymentDto) {
    return this.payments.initiate(userId, dto.orderId, dto.method);
  }

  @Get(':id/status')
  @Permissions(PERMISSIONS.ORDER_READ_OWN)
  status(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.statusForUser(userId, id);
  }
}

@Controller('payments')
export class PaymentWebhookController {
  constructor(private readonly payments: PaymentService) {}

  @Get('esewa/callback')
  @Public()
  esewa(@Query() query: Record<string, unknown>) {
    return this.payments.handleCallback('esewa', query);
  }

  @Get('khalti/callback')
  @Public()
  khalti(@Query() query: Record<string, unknown>) {
    return this.payments.handleCallback('khalti', query);
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
  async markCodPaid(@Param('orderId', ParseUUIDPipe) orderId: string) {
    await this.payments.markCodPaid(orderId);
    return { paid: true };
  }
}
