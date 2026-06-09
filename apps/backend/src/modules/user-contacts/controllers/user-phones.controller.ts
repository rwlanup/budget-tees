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
import { UserPhonesService } from '../services/user-phones.service';
import { CreatePhoneDto, UpdatePhoneDto } from '../dto/contact.dto';

@Controller('users/me/phones')
@Permissions(PERMISSIONS.PROFILE_MANAGE_OWN)
export class MePhonesController {
  constructor(private readonly phones: UserPhonesService) {}

  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.phones.list(userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePhoneDto) {
    return this.phones.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePhoneDto,
  ) {
    return this.phones.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    await this.phones.remove(userId, id);
    return { deleted: true };
  }
}

@Controller('users/:userId/phones')
@Permissions(PERMISSIONS.USER_MANAGE)
export class AdminUserPhonesController {
  constructor(private readonly phones: UserPhonesService) {}

  @Get()
  list(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.phones.list(userId);
  }

  @Post()
  create(@Param('userId', ParseUUIDPipe) userId: string, @Body() dto: CreatePhoneDto) {
    return this.phones.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePhoneDto,
  ) {
    return this.phones.update(userId, id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.phones.remove(userId, id);
    return { deleted: true };
  }
}
