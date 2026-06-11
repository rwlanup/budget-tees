import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { PickupService } from '../services/pickup.service';
import { CreatePickupDto, UpdatePickupDto } from '../dto/location.dto';

@Controller('pickup-locations')
export class PickupController {
  constructor(private readonly pickups: PickupService) {}

  @Get()
  @Public()
  list() {
    return this.pickups.list(true);
  }

  @Get('active')
  @Public()
  active() {
    return this.pickups.getActive();
  }
}

@Controller('admin/pickup-locations')
@Permissions(PERMISSIONS.LOCATION_MANAGE)
export class AdminPickupController {
  constructor(private readonly pickups: PickupService) {}

  @Get()
  list() {
    return this.pickups.list(false);
  }

  @Post()
  create(@Body() dto: CreatePickupDto) {
    return this.pickups.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePickupDto) {
    return this.pickups.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.pickups.remove(id);
    return { deleted: true };
  }
}
