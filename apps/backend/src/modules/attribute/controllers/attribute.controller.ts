import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { AttributeService } from '../services/attribute.service';
import {
  CreateAttributeDto,
  CreateAttributeValueDto,
  UpdateAttributeDto,
  UpdateAttributeValueDto,
} from '../dto/attribute.dto';

@Controller('attributes')
export class AttributeController {
  constructor(private readonly attributes: AttributeService) {}

  @Get()
  @Public()
  list() {
    return this.attributes.list();
  }

  @Get(':idOrSlug')
  @Public()
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.attributes.findOne(idOrSlug);
  }

  @Post()
  @Permissions(PERMISSIONS.ATTRIBUTE_MANAGE)
  create(@Body() dto: CreateAttributeDto) {
    return this.attributes.create(dto);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.ATTRIBUTE_MANAGE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAttributeDto) {
    return this.attributes.update(id, dto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.ATTRIBUTE_MANAGE)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.attributes.remove(id);
    return { deleted: true };
  }

  @Post(':id/values')
  @Permissions(PERMISSIONS.ATTRIBUTE_MANAGE)
  addValue(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateAttributeValueDto) {
    return this.attributes.addValue(id, dto);
  }

  @Patch(':id/values/:valueId')
  @Permissions(PERMISSIONS.ATTRIBUTE_MANAGE)
  updateValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('valueId', ParseUUIDPipe) valueId: string,
    @Body() dto: UpdateAttributeValueDto,
  ) {
    return this.attributes.updateValue(id, valueId, dto);
  }

  @Delete(':id/values/:valueId')
  @Permissions(PERMISSIONS.ATTRIBUTE_MANAGE)
  async removeValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('valueId', ParseUUIDPipe) valueId: string,
  ) {
    await this.attributes.removeValue(id, valueId);
    return { deleted: true };
  }
}
