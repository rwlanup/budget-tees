import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { ShippingCountryService } from '../services/shipping-country.service';
import { CreateShippingCountryDto } from '../dto/create-shipping-country.dto';
import { UpdateShippingCountryDto } from '../dto/update-shipping-country.dto';

@Controller('shipping-countries')
export class ShippingCountryController {
  constructor(private readonly service: ShippingCountryService) {}

  @Get()
  @Public()
  listActive() {
    return this.service.list(true);
  }
}

@Controller('admin/shipping-countries')
export class AdminShippingCountryController {
  constructor(private readonly service: ShippingCountryService) {}

  @Get()
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  listAll() {
    return this.service.list(false);
  }

  @Post()
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  create(@Body() dto: CreateShippingCountryDto) {
    return this.service.create(dto);
  }

  @Patch(':code')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  update(@Param('code') code: string, @Body() dto: UpdateShippingCountryDto) {
    return this.service.update(code, dto);
  }

  @Delete(':code')
  @Permissions(PERMISSIONS.SETTINGS_MANAGE)
  async remove(@Param('code') code: string) {
    await this.service.remove(code);
    return { deleted: true };
  }
}
