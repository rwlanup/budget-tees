import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { ReturnService } from './return.service';
import {
  CreateReturnDto,
  ListReturnsQueryDto,
  ReceiveReturnDto,
  ResolveReturnDto,
  ReviewReturnDto,
} from './dto/return.dto';

@Controller()
export class ReturnController {
  constructor(private readonly returns: ReturnService) {}

  @Get('orders/:orderId/returnable')
  @Permissions(PERMISSIONS.RETURN_CREATE_OWN)
  returnable(@CurrentUser('id') userId: string, @Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.returns.returnable(userId, orderId);
  }

  @Post('orders/:orderId/returns')
  @Permissions(PERMISSIONS.RETURN_CREATE_OWN)
  create(
    @CurrentUser('id') userId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateReturnDto,
  ) {
    return this.returns.create(userId, orderId, dto);
  }

  @Get('returns')
  @Permissions(PERMISSIONS.RETURN_CREATE_OWN)
  list(@CurrentUser('id') userId: string, @Query() query: ListReturnsQueryDto) {
    return this.returns.listForUser(userId, query);
  }

  @Get('returns/:idOrNumber')
  @Permissions(PERMISSIONS.RETURN_CREATE_OWN)
  findOne(@Param('idOrNumber') idOrNumber: string) {
    return this.returns.findOne(idOrNumber);
  }

  @Post('returns/:id/cancel')
  @Permissions(PERMISSIONS.RETURN_CREATE_OWN)
  cancel(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.returns.cancel(userId, id);
  }
}

@Controller('admin/returns')
@Permissions(PERMISSIONS.RETURN_MANAGE)
export class AdminReturnController {
  constructor(private readonly returns: ReturnService) {}

  @Get()
  list(@Query() query: ListReturnsQueryDto) {
    return this.returns.adminList(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.returns.findOne(id);
  }

  @Patch(':id/review')
  review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewReturnDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.returns.review(id, dto, adminId);
  }

  @Patch(':id/receive')
  receive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReceiveReturnDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.returns.receive(id, dto, adminId);
  }

  @Post(':id/resolve')
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReturnDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.returns.resolve(id, dto, adminId);
  }
}
