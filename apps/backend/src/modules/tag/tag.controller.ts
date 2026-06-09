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
import { TagService } from './tag.service';
import { CreateTagDto, ListTagQueryDto, MergeTagsDto, UpdateTagDto } from './dto/tag.dto';

@Controller('tags')
export class TagController {
  constructor(private readonly tags: TagService) {}

  @Get()
  @Public()
  list(@Query() query: ListTagQueryDto) {
    return this.tags.list(query);
  }

  @Get(':idOrSlug')
  @Public()
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.tags.findOne(idOrSlug);
  }

  @Post()
  @Permissions(PERMISSIONS.TAG_MANAGE)
  create(@Body() dto: CreateTagDto) {
    return this.tags.create(dto);
  }

  @Post('merge')
  @Permissions(PERMISSIONS.TAG_MANAGE)
  merge(@Body() dto: MergeTagsDto) {
    return this.tags.merge(dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.TAG_MANAGE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTagDto) {
    return this.tags.update(id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.TAG_MANAGE)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.tags.remove(id);
    return { deleted: true };
  }
}
