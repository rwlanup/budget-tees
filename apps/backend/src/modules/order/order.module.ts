import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { CheckoutService } from './services/checkout.service';
import { OrderService } from './services/order.service';
import { OrderStatusService } from './services/order-status.service';
import { InvoiceService } from './services/invoice.service';
import { OrderController } from './controllers/order.controller';
import { AdminOrderController } from './controllers/admin-order.controller';
import { CartModule } from '../cart/cart.module';
import { ProductModule } from '../product/product.module';
import { SkuModule } from '../sku/sku.module';
import { ProductSaleModule } from '../product-sale/product-sale.module';
import { TaxModule } from '../tax/tax.module';
import { LocationModule } from '../location/location.module';
import { CategoryModule } from '../category/category.module';
import { CouponModule } from '../coupon/coupon.module';
import { AttributeValue } from '../attribute/entities/attribute-value.entity';
import { ReturnRequest } from '../return/entities/return-request.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, OrderStatusHistory, AttributeValue, ReturnRequest]),
    CartModule,
    ProductModule,
    SkuModule,
    ProductSaleModule,
    TaxModule,
    LocationModule,
    CategoryModule,
    CouponModule,
    MediaModule,
  ],
  controllers: [OrderController, AdminOrderController],
  providers: [CheckoutService, OrderService, OrderStatusService, InvoiceService],
  exports: [OrderService],
})
export class OrderModule {}
