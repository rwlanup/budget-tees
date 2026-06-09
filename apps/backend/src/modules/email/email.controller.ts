import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { IsEmail, IsObject, IsOptional, IsString } from 'class-validator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { EmailService } from './email.service';
import { EmailStatus } from './enums/email.enums';

class TestEmailDto {
  @IsString() template: string;
  @IsEmail() to: string;
  @IsOptional() @IsObject() sampleData?: Record<string, unknown>;
}

@Controller('admin/emails')
@Permissions(PERMISSIONS.EMAIL_MANAGE)
export class AdminEmailController {
  constructor(private readonly email: EmailService) {}

  @Get()
  list(@Query('status') status?: EmailStatus) {
    return this.email.list(status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.email.findOne(id);
  }

  @Post(':id/resend')
  resend(@Param('id', ParseUUIDPipe) id: string) {
    return this.email.resend(id);
  }

  @Post('test')
  test(@Body() dto: TestEmailDto) {
    return this.email.enqueue({ template: dto.template, to: dto.to, data: dto.sampleData ?? {} });
  }
}
