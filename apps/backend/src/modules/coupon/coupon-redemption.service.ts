import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CouponCategory, CouponProduct, CouponRedemption } from './entities/coupon-links.entity';
import { CouponAppliesTo, CouponType, RedemptionStatus } from './enums/coupon.enums';
import { CouponService } from './coupon.service';
import { addMoney, round2 } from '../../common/utils/money';

export interface CouponLine {
  productId: string;
  categoryLineage: string[]; // product category + ancestors
  lineTotal: number;
}

export interface CouponContext {
  userId?: string;
  subtotal: number;
  lines: CouponLine[];
}

export interface CouponResult {
  coupon: Coupon;
  discountAmount: number;
  freeShipping: boolean;
  eligibleSubtotal: number;
}

@Injectable()
export class CouponRedemptionService {
  constructor(
    @InjectRepository(Coupon) private readonly repo: Repository<Coupon>,
    @InjectRepository(CouponRedemption) private readonly redRepo: Repository<CouponRedemption>,
    @InjectRepository(CouponProduct) private readonly cpRepo: Repository<CouponProduct>,
    @InjectRepository(CouponCategory) private readonly ccRepo: Repository<CouponCategory>,
    private readonly coupons: CouponService,
    private readonly dataSource: DataSource,
  ) {}

  private fail(reason: string): never {
    const messageMap: Record<string, string> = {
      INVALID_COUPON: 'Invalid coupon code',
      NOT_STARTED: 'Coupon not active yet',
      EXPIRED: 'Coupon has expired',
      USAGE_LIMIT: 'You have reached the usage limit for this coupon',
      NOT_FIRST_ORDER: 'Coupon valid for first order only',
      NOT_ELIGIBLE: 'Cart not eligible for this coupon',
      MIN_ORDER_NOT_MET: 'Minimum order amount not met for this coupon',
    };
    throw new UnprocessableEntityException(messageMap[reason] || reason, {
      cause: reason,
      description: reason,
    });
  }

  async validateOrThrow(code: string, ctx: CouponContext): Promise<CouponResult> {
    const coupon = await this.coupons.findByCode(code);
    if (!coupon || !coupon.isActive) this.fail('INVALID_COUPON');

    const now = Date.now();
    if (coupon!.startsAt && coupon!.startsAt.getTime() > now) this.fail('NOT_STARTED');
    if (coupon!.endsAt && coupon!.endsAt.getTime() < now) this.fail('EXPIRED');

    if (coupon!.usageLimit != null && coupon!.usedCount >= coupon!.usageLimit) {
      this.fail('USAGE_LIMIT');
    }

    if (ctx.userId && coupon!.usageLimitPerUser != null) {
      const used = await this.redRepo.count({
        where: { couponId: coupon!.id, userId: ctx.userId, status: RedemptionStatus.APPLIED },
      });
      if (used >= coupon!.usageLimitPerUser) this.fail('USAGE_LIMIT');
    }

    if (coupon!.firstOrderOnly && ctx.userId && (await this.hasCompletedOrder(ctx.userId))) {
      this.fail('NOT_FIRST_ORDER');
    }

    const eligibleSubtotal = await this.eligibleSubtotal(coupon!, ctx);
    if (eligibleSubtotal <= 0) this.fail('NOT_ELIGIBLE');
    if (coupon!.minOrderAmount != null && ctx.subtotal < coupon!.minOrderAmount) {
      this.fail('MIN_ORDER_NOT_MET');
    }

    const { discountAmount, freeShipping } = this.computeDiscount(coupon!, eligibleSubtotal);
    return { coupon: coupon!, discountAmount, freeShipping, eligibleSubtotal };
  }

  /** Record redemption + increment usage atomically. Call inside the order txn. */
  async redeem(
    couponId: string,
    userId: string | undefined,
    orderId: string,
    discountAmount: number,
    mgr: EntityManager,
  ): Promise<void> {
    const coupon = await mgr.getRepository(Coupon).findOne({
      where: { id: couponId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!coupon) this.fail('INVALID_COUPON');
    if (coupon!.usageLimit != null && coupon!.usedCount >= coupon!.usageLimit)
      this.fail('USAGE_LIMIT');
    coupon!.usedCount += 1;
    await mgr.getRepository(Coupon).save(coupon!);
    await mgr.getRepository(CouponRedemption).save(
      mgr.getRepository(CouponRedemption).create({
        couponId,
        userId: userId ?? null,
        orderId,
        discountAmount,
        status: RedemptionStatus.APPLIED,
      }),
    );
  }

  /** Reverse all applied redemptions for an order (cancel/refund). */
  async reverse(orderId: string, mgr?: EntityManager): Promise<void> {
    const run = async (m: EntityManager) => {
      const redemptions = await m.getRepository(CouponRedemption).find({
        where: { orderId, status: RedemptionStatus.APPLIED },
      });
      for (const r of redemptions) {
        r.status = RedemptionStatus.REVERSED;
        await m.getRepository(CouponRedemption).save(r);
        const coupon = await m.getRepository(Coupon).findOne({
          where: { id: r.couponId },
          lock: { mode: 'pessimistic_write' },
        });
        if (coupon && coupon.usedCount > 0) {
          coupon.usedCount -= 1;
          await m.getRepository(Coupon).save(coupon);
        }
      }
    };
    return mgr ? run(mgr) : this.dataSource.transaction(run);
  }

  private computeDiscount(
    coupon: Coupon,
    eligibleSubtotal: number,
  ): { discountAmount: number; freeShipping: boolean } {
    if (coupon.type === CouponType.FREE_SHIPPING) {
      return { discountAmount: 0, freeShipping: true };
    }
    if (coupon.type === CouponType.PERCENTAGE) {
      let discount = (eligibleSubtotal * (coupon.value ?? 0)) / 100;
      if (coupon.maxDiscountAmount != null) discount = Math.min(discount, coupon.maxDiscountAmount);
      return { discountAmount: round2(Math.min(discount, eligibleSubtotal)), freeShipping: false };
    }
    // FIXED
    return {
      discountAmount: round2(Math.min(coupon.value ?? 0, eligibleSubtotal)),
      freeShipping: false,
    };
  }

  private async eligibleSubtotal(coupon: Coupon, ctx: CouponContext): Promise<number> {
    if (coupon.appliesTo === CouponAppliesTo.ALL) return ctx.subtotal;
    if (coupon.appliesTo === CouponAppliesTo.PRODUCTS) {
      const links = await this.cpRepo.find({ where: { couponId: coupon.id } });
      const ids = new Set(links.map((l) => l.productId));
      return addMoney(...ctx.lines.filter((l) => ids.has(l.productId)).map((l) => l.lineTotal));
    }
    // CATEGORIES
    const links = await this.ccRepo.find({ where: { couponId: coupon.id } });
    const catIds = new Set(links.map((l) => l.categoryId));
    return addMoney(
      ...ctx.lines
        .filter((l) => l.categoryLineage.some((c) => catIds.has(c)))
        .map((l) => l.lineTotal),
    );
  }

  private async hasCompletedOrder(userId: string): Promise<boolean> {
    try {
      const rows = await this.dataSource.query(
        `SELECT 1 FROM orders WHERE "userId" = $1 AND "paymentStatus" = 'PAID' LIMIT 1`,
        [userId],
      );
      return rows.length > 0;
    } catch {
      return false;
    }
  }
}
