import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  ListCategoryQueryDto,
  MoveCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categories: CategoryService) {}

  @Get('tree')
  @Public()
  tree() {
    return this.categories.tree(true);
  }

  @Get()
  @Public()
  list(@Query() query: ListCategoryQueryDto) {
    return this.categories.list(query);
  }

  @Get(':idOrSlug')
  @Public()
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.categories.findOne(idOrSlug);
  }

  @Get(':id/ancestors')
  @Public()
  ancestors(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.ancestors(id);
  }

  @Get(':id/children')
  @Public()
  children(@Param('id', ParseUUIDPipe) id: string) {
    return this.categories.children(id);
  }

  @Post()
  @Permissions(PERMISSIONS.CATEGORY_MANAGE)
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch('reorder')
  @Permissions(PERMISSIONS.CATEGORY_MANAGE)
  reorder(@Body() dto: ReorderCategoriesDto) {
    return this.categories.reorder(dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.CATEGORY_MANAGE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Patch(':id/move')
  @Permissions(PERMISSIONS.CATEGORY_MANAGE)
  move(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoveCategoryDto) {
    return this.categories.move(id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.CATEGORY_MANAGE)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('cascade', new ParseBoolPipe({ optional: true })) cascade?: boolean,
  ) {
    await this.categories.remove(id, cascade ?? false);
    return { deleted: true };
  }
}
