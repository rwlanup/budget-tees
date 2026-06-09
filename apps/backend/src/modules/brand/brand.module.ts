import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { BrandService } from './brand.service';
import { BrandController, AdminBrandController } from './brand.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Brand]), MediaModule],
  controllers: [BrandController, AdminBrandController],
  providers: [BrandService],
  exports: [BrandService],
})
export class BrandModule {}
