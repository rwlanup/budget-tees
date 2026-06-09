import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnRequest } from './entities/return-request.entity';
import { ReturnItem } from './entities/return-item.entity';
import { ReturnService } from './return.service';
import { AdminReturnController, ReturnController } from './return.controller';
import { OrderModule } from '../order/order.module';
import { SkuModule } from '../sku/sku.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReturnRequest, ReturnItem]),
    OrderModule,
    SkuModule,
    PaymentModule,
  ],
  controllers: [ReturnController, AdminReturnController],
  providers: [ReturnService],
  exports: [ReturnService],
})
export class ReturnModule {}
