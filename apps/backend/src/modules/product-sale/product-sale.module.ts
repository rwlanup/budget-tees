import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SaleCategory, SaleExcludedProduct, SaleProduct } from './entities/sale-links.entity';
import { SaleService } from './services/sale.service';
import { SaleResolverService } from './services/sale-resolver.service';
import { AdminSaleController, PublicSaleController } from './product-sale.controller';
import { CategoryModule } from '../category/category.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleProduct, SaleCategory, SaleExcludedProduct]),
    CategoryModule,
    ProductModule,
  ],
  controllers: [PublicSaleController, AdminSaleController],
  providers: [SaleService, SaleResolverService],
  exports: [SaleService, SaleResolverService],
})
export class ProductSaleModule {}
