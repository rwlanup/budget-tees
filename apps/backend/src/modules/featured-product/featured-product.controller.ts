import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { FeaturedProductService } from './featured-product.service';
import { AddFeaturedDto, ReorderFeaturedDto, UpdateFeaturedDto } from './dto/featured.dto';

@Controller('featured-products')
export class FeaturedProductController {
  constructor(private readonly featured: FeaturedProductService) {}

  @Get()
  @Public()
  list() {
    return this.featured.listPublic();
  }
}

@Controller('admin/featured-products')
@Permissions(PERMISSIONS.FEATURED_MANAGE)
export class AdminFeaturedProductController {
  constructor(private readonly featured: FeaturedProductService) {}

  @Get()
  list() {
    return this.featured.adminList();
  }

  @Post()
  add(@Body() dto: AddFeaturedDto, @CurrentUser('id') adminId: string) {
    return this.featured.add(dto, adminId);
  }

  @Patch('reorder')
  reorder(@Body() dto: ReorderFeaturedDto) {
    return this.featured.reorder(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFeaturedDto) {
    return this.featured.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.featured.remove(id);
    return { deleted: true };
  }
}
