import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sku } from '../sku/entities/sku.entity';
import { SkuAttributeValue } from '../sku/entities/sku-attribute-value.entity';
import { Product } from '../product/entities/product.entity';
import { ProductMedia } from '../product/entities/product-media.entity';
import { AttributeValue } from '../attribute/entities/attribute-value.entity';
import { Attribute } from '../attribute/entities/attribute.entity';
import { Tag } from '../tag/entities/tag.entity';
import { ProductModule } from '../product/product.module';
import { CategoryModule } from '../category/category.module';
import { AttributeModule } from '../attribute/attribute.module';
import { ProductSaleModule } from '../product-sale/product-sale.module';
import { MediaModule } from '../media/media.module';
import { StorefrontService } from './storefront.service';
import { StorefrontController } from './storefront.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sku,
      SkuAttributeValue,
      Product,
      ProductMedia,
      AttributeValue,
      Attribute,
      Tag,
    ]),
    ProductModule,
    CategoryModule,
    AttributeModule,
    ProductSaleModule,
    MediaModule,
  ],
  controllers: [StorefrontController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
