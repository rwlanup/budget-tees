import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { CartService } from './cart.service';
import { CartPricingService } from './cart-pricing.service';
import { CartController } from './cart.controller';
import { SkuModule } from '../sku/sku.module';
import { ProductModule } from '../product/product.module';
import { ProductSaleModule } from '../product-sale/product-sale.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem]),
    SkuModule,
    ProductModule,
    ProductSaleModule,
  ],
  controllers: [CartController],
  providers: [CartService, CartPricingService],
  exports: [CartService, CartPricingService],
})
export class CartModule {}
