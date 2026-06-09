import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { TaxService } from './services/tax.service';
import {
  CreateTaxClassDto,
  CreateTaxRateDto,
  UpdateTaxClassDto,
  UpdateTaxRateDto,
} from './dto/tax.dto';

@Controller('admin/tax-classes')
@Permissions(PERMISSIONS.TAX_MANAGE)
export class TaxClassController {
  constructor(private readonly tax: TaxService) {}

  @Get()
  list() {
    return this.tax.listClasses();
  }

  @Post()
  create(@Body() dto: CreateTaxClassDto) {
    return this.tax.createClass(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaxClassDto) {
    return this.tax.updateClass(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.tax.removeClass(id);
    return { deleted: true };
  }
}

@Controller('admin/tax-rates')
@Permissions(PERMISSIONS.TAX_MANAGE)
export class TaxRateController {
  constructor(private readonly tax: TaxService) {}

  @Get()
  list(@Query('countryCode') country?: string, @Query('taxClassId') taxClassId?: string) {
    return this.tax.listRates(country, taxClassId);
  }

  @Post()
  create(@Body() dto: CreateTaxRateDto) {
    return this.tax.createRate(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaxRateDto) {
    return this.tax.updateRate(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.tax.removeRate(id);
    return { deleted: true };
  }
}
