export type CouponType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
export type CouponAppliesTo = 'ALL' | 'PRODUCTS' | 'CATEGORIES';

export const COUPON_TYPES: CouponType[] = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'];
export const COUPON_APPLIES_TO: CouponAppliesTo[] = ['ALL', 'PRODUCTS', 'CATEGORIES'];

/** Mirrors backend Coupon entity (link arrays are NOT returned by the API). */
export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number | null;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  appliesTo: CouponAppliesTo;
  firstOrderOnly: boolean;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CouponStatus = 'inactive' | 'upcoming' | 'active' | 'expired';

export function couponStatus(c: Coupon, now = new Date()): CouponStatus {
  if (!c.isActive) return 'inactive';
  if (c.startsAt && now < new Date(c.startsAt)) return 'upcoming';
  if (c.endsAt && now > new Date(c.endsAt)) return 'expired';
  return 'active';
}
