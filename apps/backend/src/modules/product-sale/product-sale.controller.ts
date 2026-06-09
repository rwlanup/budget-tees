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
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { SaleService } from './services/sale.service';
import { CreateSaleDto, ListSaleQueryDto, UpdateSaleDto } from './dto/sale.dto';

@Controller('sales')
export class PublicSaleController {
  constructor(private readonly sales: SaleService) {}

  @Get('active')
  @Public()
  active() {
    return this.sales.activeSales();
  }
}

@Controller('admin/sales')
@Permissions(PERMISSIONS.SALE_MANAGE)
export class AdminSaleController {
  constructor(private readonly sales: SaleService) {}

  @Get()
  list(@Query() query: ListSaleQueryDto) {
    return this.sales.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sales.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.sales.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSaleDto) {
    return this.sales.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.sales.remove(id);
    return { deleted: true };
  }
}
