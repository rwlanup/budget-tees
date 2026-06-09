import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductMedia } from './entities/product-media.entity';
import { ProductService } from './product.service';
import { ProductMediaService } from './product-media.service';
import { ProductController } from './controllers/product.controller';
import { AdminProductController } from './controllers/admin-product.controller';
import { CategoryModule } from '../category/category.module';
import { BrandModule } from '../brand/brand.module';
import { TagModule } from '../tag/tag.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductMedia]),
    CategoryModule,
    BrandModule,
    TagModule,
    MediaModule,
  ],
  controllers: [ProductController, AdminProductController],
  providers: [ProductService, ProductMediaService],
  exports: [ProductService],
})
export class ProductModule {}
