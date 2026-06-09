import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute-value.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { AttributeService } from './services/attribute.service';
import { ProductAttributeService } from './services/product-attribute.service';
import { AttributeController } from './controllers/attribute.controller';
import { ProductAttributeController } from './controllers/product-attribute.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attribute,
      AttributeValue,
      ProductAttribute,
      ProductAttributeValue,
    ]),
  ],
  controllers: [AttributeController, ProductAttributeController],
  providers: [AttributeService, ProductAttributeService],
  exports: [AttributeService, ProductAttributeService],
})
export class AttributeModule {}
