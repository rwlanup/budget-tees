import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions';
import { CouponService } from './coupon.service';
import { CouponRedemptionService } from './coupon-redemption.service';
import { CouponContextService } from './coupon-context.service';
import {
  CreateCouponDto,
  ListCouponQueryDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/coupon.dto';

@Controller('coupons')
export class CouponValidationController {
  constructor(
    private readonly redemption: CouponRedemptionService,
    private readonly context: CouponContextService,
  ) {}

  @Post('validate')
  @OptionalAuth()
  async validate(
    @Body() dto: ValidateCouponDto,
    @CurrentUser('id') userId?: string,
    @Headers('x-cart-token') token?: string,
  ) {
    const ctx = await this.context.fromCart({ userId, token });
    const result = await this.redemption.validateOrThrow(dto.code, ctx);
    return {
      valid: true,
      code: result.coupon.code,
      type: result.coupon.type,
      discountAmount: result.discountAmount,
      freeShipping: result.freeShipping,
      eligibleSubtotal: result.eligibleSubtotal,
    };
  }
}

@Controller('admin/coupons')
@Permissions(PERMISSIONS.COUPON_MANAGE)
export class AdminCouponController {
  constructor(private readonly coupons: CouponService) {}

  @Get()
  list(@Query() query: ListCouponQueryDto) {
    return this.coupons.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coupons.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.coupons.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.coupons.remove(id);
    return { deleted: true };
  }
}
