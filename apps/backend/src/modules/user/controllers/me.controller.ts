import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserService } from '../user.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Controller('users/me')
@Permissions(PERMISSIONS.PROFILE_MANAGE_OWN)
export class MeController {
  constructor(private readonly users: UserService) {}

  @Get()
  me(@CurrentUser('id') userId: string) {
    return this.users.findById(userId);
  }

  @Patch()
  update(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }

  @Post('deactivate')
  async deactivateAccount(@CurrentUser('id') userId: string) {
    await this.users.deactivate(userId);
    return { deactivated: true };
  }

  @Delete()
  async deactivate(@CurrentUser('id') userId: string) {
    await this.users.softDeleteAndAnonymize(userId);
    return { deleted: true };
  }
}
