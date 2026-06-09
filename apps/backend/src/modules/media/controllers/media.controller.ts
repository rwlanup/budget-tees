import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { MediaService, UploadedFile as MulterFile } from '../services/media.service';
import { UpdateMediaDto } from '../dto/update-media.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @Permissions(PERMISSIONS.MEDIA_MANAGE)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  upload(
    @UploadedFile() file: MulterFile,
    @Body('altText') altText: string | undefined,
    @CurrentUser('id') userId?: string,
  ) {
    return this.media.upload(file, altText, userId);
  }

  @Get(':id')
  @Public()
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.media.findOne(id);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.MEDIA_MANAGE)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMediaDto) {
    return this.media.updateAlt(id, dto.altText);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.MEDIA_MANAGE)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.media.remove(id);
    return { deleted: true };
  }
}
