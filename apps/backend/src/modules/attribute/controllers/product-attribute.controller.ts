import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { ProductAttributeService } from '../services/product-attribute.service';
import { SetProductAttributesDto } from '../dto/attribute.dto';

@Controller('products/:productId/attributes')
export class ProductAttributeController {
  constructor(private readonly productAttributes: ProductAttributeService) {}

  @Get()
  @Public()
  get(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.productAttributes.getForProduct(productId);
  }

  @Put()
  @Permissions(PERMISSIONS.PRODUCT_MANAGE)
  set(@Param('productId', ParseUUIDPipe) productId: string, @Body() dto: SetProductAttributesDto) {
    return this.productAttributes.setForProduct(productId, dto);
  }
}
