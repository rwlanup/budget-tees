import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeaturedProduct } from './entities/featured-product.entity';
import { FeaturedProductService } from './featured-product.service';
import {
  AdminFeaturedProductController,
  FeaturedProductController,
} from './featured-product.controller';
import { ProductModule } from '../product/product.module';
import { SkuModule } from '../sku/sku.module';
import { ProductSaleModule } from '../product-sale/product-sale.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FeaturedProduct]),
    ProductModule,
    SkuModule,
    ProductSaleModule,
  ],
  controllers: [FeaturedProductController, AdminFeaturedProductController],
  providers: [FeaturedProductService],
  exports: [FeaturedProductService],
})
export class FeaturedProductModule {}
