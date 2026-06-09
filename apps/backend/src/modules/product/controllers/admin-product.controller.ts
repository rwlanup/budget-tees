import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { ProductService } from '../product.service';
import { ProductMediaService } from '../product-media.service';
import {
  CreateProductDto,
  ListProductQueryDto,
  SetTagsDto,
  UpdateProductDto,
  UpdateStatusDto,
} from '../dto/product.dto';
import { SetProductMediaDto } from '../dto/set-media.dto';

@Controller('admin/products')
@Permissions(PERMISSIONS.PRODUCT_MANAGE)
export class AdminProductController {
  constructor(
    private readonly products: ProductService,
    private readonly gallery: ProductMediaService,
  ) {}

  @Get()
  list(@Query() query: ListProductQueryDto) {
    return this.products.adminList(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.products.findOneByIdOrSlug(id, false);
  }

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Patch(':id/status')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusDto) {
    return this.products.setStatus(id, dto.status);
  }

  @Patch(':id/tags')
  setTags(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetTagsDto) {
    return this.products.setTags(id, dto);
  }

  @Put(':id/media')
  setMedia(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetProductMediaDto) {
    return this.gallery.setGallery(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.products.softDelete(id);
    return { deleted: true };
  }
}
