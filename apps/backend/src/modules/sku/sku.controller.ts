import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { SkuService } from './services/sku.service';
import { CreateSkuDto, GenerateSkusDto, UpdateSkuDto, AdjustStockDto } from './dto/sku.dto';

@Controller('products/:productId/skus')
export class ProductSkuController {
  constructor(private readonly skus: SkuService) {}

  @Get()
  @Public()
  list(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.skus.listForProduct(productId, true);
  }

  @Post('generate')
  @Permissions(PERMISSIONS.SKU_MANAGE)
  generate(@Param('productId', ParseUUIDPipe) productId: string, @Body() dto: GenerateSkusDto) {
    return this.skus.generate(productId, dto);
  }

  @Post()
  @Permissions(PERMISSIONS.SKU_MANAGE)
  create(@Param('productId', ParseUUIDPipe) productId: string, @Body() dto: CreateSkuDto) {
    return this.skus.create(productId, dto);
  }
}

@Controller('skus')
export class SkuController {
  constructor(private readonly skus: SkuService) {}

  @Get('low-stock')
  @Permissions(PERMISSIONS.SKU_MANAGE)
  lowStock() {
    return this.skus.lowStock();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.skus.findOne(id);
  }

  @Get(':id/movements')
  @Permissions(PERMISSIONS.SKU_MANAGE)
  movements(@Param('id', ParseUUIDPipe) id: string) {
    return this.skus.movements(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.SKU_MANAGE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSkuDto) {
    return this.skus.update(id, dto);
  }

  @Patch(':id/adjust-stock')
  @Permissions(PERMISSIONS.SKU_MANAGE)
  adjust(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.skus.adjustStock(id, dto, userId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.SKU_MANAGE)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.skus.remove(id);
    return { deleted: true };
  }
}
