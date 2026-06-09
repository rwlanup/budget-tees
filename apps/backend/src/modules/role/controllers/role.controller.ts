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
import { RoleService } from '../services/role.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { SetPermissionsDto } from '../dto/set-permissions.dto';
import { ListRolesQueryDto } from '../dto/list-roles-query.dto';

@Controller('roles')
@Permissions(PERMISSIONS.ROLE_MANAGE)
export class RoleController {
  constructor(private readonly roles: RoleService) {}

  @Get()
  list(@Query() query: ListRolesQueryDto) {
    return this.roles.findAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roles.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @Put(':id/permissions')
  setPermissions(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetPermissionsDto) {
    return this.roles.setPermissions(id, dto.permissionKeys);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.roles.remove(id);
    return { deleted: true };
  }
}
