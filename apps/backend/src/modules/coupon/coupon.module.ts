import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import {
  CouponCategory,
  CouponProduct,
  CouponRedemption,
} from './entities/coupon-links.entity';
import { CouponService } from './coupon.service';
import { CouponRedemptionService } from './coupon-redemption.service';
import { CouponContextService } from './coupon-context.service';
import { AdminCouponController, CouponValidationController } from './coupon.controller';
import { CartModule } from '../cart/cart.module';
import { ProductModule } from '../product/product.module';
import { CategoryModule } from '../category/category.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, CouponProduct, CouponCategory, CouponRedemption]),
    CartModule,
    ProductModule,
    CategoryModule,
  ],
  controllers: [CouponValidationController, AdminCouponController],
  providers: [CouponService, CouponRedemptionService, CouponContextService],
  exports: [CouponService, CouponRedemptionService, CouponContextService],
})
export class CouponModule {}
