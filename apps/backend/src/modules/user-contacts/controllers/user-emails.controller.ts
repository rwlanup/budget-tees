import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { UserEmailsService } from '../services/user-emails.service';
import { CreateEmailDto, UpdateEmailDto } from '../dto/contact.dto';

@Controller('users/me/emails')
@Permissions(PERMISSIONS.PROFILE_MANAGE_OWN)
export class MeEmailsController {
  constructor(private readonly emails: UserEmailsService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.emails.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateEmailDto) {
    return this.emails.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmailDto,
  ) {
    return this.emails.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    await this.emails.remove(userId, id);
    return { deleted: true };
  }
}

@Controller('users/:userId/emails')
@Permissions(PERMISSIONS.USER_MANAGE)
export class AdminUserEmailsController {
  constructor(private readonly emails: UserEmailsService) {}

  @Get()
  list(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.emails.list(userId);
  }

  @Post()
  create(@Param('userId', ParseUUIDPipe) userId: string, @Body() dto: CreateEmailDto) {
    return this.emails.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmailDto,
  ) {
    return this.emails.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.emails.remove(userId, id);
    return { deleted: true };
  }
}
