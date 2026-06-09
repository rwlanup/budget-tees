import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sku } from './entities/sku.entity';
import { SkuAttributeValue } from './entities/sku-attribute-value.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { SkuService } from './services/sku.service';
import { InventoryService } from './services/inventory.service';
import { ProductSkuController, SkuController } from './sku.controller';
import { ProductModule } from '../product/product.module';
import { AttributeModule } from '../attribute/attribute.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sku, SkuAttributeValue, StockMovement]),
    ProductModule,
    AttributeModule,
  ],
  controllers: [ProductSkuController, SkuController],
  providers: [SkuService, InventoryService],
  exports: [SkuService, InventoryService],
})
export class SkuModule {}
