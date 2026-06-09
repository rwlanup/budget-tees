import { Controller, Get, Query } from '@nestjs/common';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { PermissionService } from '../services/permission.service';

@Controller('permissions')
@Permissions(PERMISSIONS.ROLE_MANAGE)
export class PermissionController {
  constructor(private readonly permissions: PermissionService) {}

  @Get()
  list(@Query('group') group?: string) {
    return this.permissions.list(group);
  }
}
