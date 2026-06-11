import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/constants/permissions';
import { ShippingZoneService } from '../services/shipping-zone.service';
import { ShippingCalculatorService } from '../services/shipping-calculator.service';
import { CreateZoneDto, ShippingQuoteDto, UpdateZoneDto } from '../dto/location.dto';

@Controller('shipping')
export class ShippingQuoteController {
  constructor(private readonly calculator: ShippingCalculatorService) {}

  @Post('quote')
  @Public()
  quote(@Body() dto: ShippingQuoteDto) {
    return this.calculator.calculate(dto.method, dto.subtotal, dto.countryCode, dto.region);
  }
}

@Controller('admin/shipping-zones')
@Permissions(PERMISSIONS.LOCATION_MANAGE)
export class AdminShippingZoneController {
  constructor(private readonly zones: ShippingZoneService) {}

  @Get()
  list() {
    return this.zones.list();
  }

  @Post()
  create(@Body() dto: CreateZoneDto) {
    return this.zones.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateZoneDto) {
    return this.zones.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.zones.remove(id);
    return { deleted: true };
  }
}
