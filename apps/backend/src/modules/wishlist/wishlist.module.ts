import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistProduct } from './entities/wishlist-product.entity';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { ProductModule } from '../product/product.module';
import { SkuModule } from '../sku/sku.module';
import { ProductSaleModule } from '../product-sale/product-sale.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WishlistProduct]),
    ProductModule,
    SkuModule,
    ProductSaleModule,
    CartModule,
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService],
})
export class WishlistModule {}
