import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { ContactService } from './contact.service';
import { AdminListContactQueryDto, SetContactStatusDto } from './dto/contact-message.dto';

@Controller('admin/contact-messages')
@Permissions(PERMISSIONS.CONTACT_MANAGE)
export class AdminContactController {
  constructor(private readonly contact: ContactService) {}

  @Get()
  list(@Query() query: AdminListContactQueryDto) {
    return this.contact.adminList(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contact.findOne(id);
  }

  @Patch(':id/status')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetContactStatusDto) {
    return this.contact.setStatus(id, dto.status);
  }
}
