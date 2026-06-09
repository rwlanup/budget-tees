import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { BrandService } from './brand.service';
import { CreateBrandDto, ListBrandQueryDto, UpdateBrandDto } from './dto/brand.dto';

@Controller('brands')
export class BrandController {
  constructor(private readonly brands: BrandService) {}

  @Get()
  @Public()
  list(@Query() query: ListBrandQueryDto) {
    return this.brands.list(query, false);
  }

  @Get(':idOrSlug')
  @Public()
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.brands.findOne(idOrSlug);
  }
}

@Controller('admin/brands')
@Permissions(PERMISSIONS.BRAND_MANAGE)
export class AdminBrandController {
  constructor(private readonly brands: BrandService) {}

  @Get()
  list(@Query() query: ListBrandQueryDto) {
    return this.brands.list(query, true);
  }

  @Post()
  create(@Body() dto: CreateBrandDto) {
    return this.brands.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBrandDto) {
    return this.brands.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.brands.remove(id);
    return { deleted: true };
  }
}
