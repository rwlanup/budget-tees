import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { SettingsService } from '../services/settings.service';
import { UpsertSettingDto } from '../dto/upsert-setting.dto';
import { BulkUpsertSettingsDto } from '../dto/bulk-upsert-settings.dto';

@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  list(@Query('group') group?: string) {
    return this.settings.getAllForAdmin(group);
  }

  @Get(':key')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  getOne(@Param('key') key: string) {
    return this.settings.getOneForAdmin(key);
  }

  @Put()
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async bulkUpsert(@Body() dto: BulkUpsertSettingsDto, @CurrentUser('id') userId?: string) {
    await this.settings.bulkUpsert(dto.items, userId);
    return { updated: dto.items.length };
  }

  @Put(':key')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async upsert(
    @Param('key') key: string,
    @Body() dto: UpsertSettingDto,
    @CurrentUser('id') userId?: string,
  ) {
    await this.settings.upsert(key, dto.value, userId);
    return this.settings.getOneForAdmin(key);
  }
}

@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('public')
  @Public()
  getPublic() {
    return this.settings.getPublic();
  }
}
