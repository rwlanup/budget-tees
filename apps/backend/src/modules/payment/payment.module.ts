import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentRefund } from './entities/payment-refund.entity';
import { PaymentEvent } from './entities/payment-event.entity';
import { PaymentService } from './payment.service';
import { RefundService } from './refund.service';
import { EsewaGateway } from './gateways/esewa.gateway';
import {
  AdminPaymentController,
  PaymentController,
  PaymentWebhookController,
} from './payment.controller';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, PaymentRefund, PaymentEvent]), OrderModule],
  controllers: [PaymentController, PaymentWebhookController, AdminPaymentController],
  providers: [PaymentService, RefundService, EsewaGateway],
  exports: [PaymentService, RefundService],
})
export class PaymentModule {}
