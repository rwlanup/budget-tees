import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type { Coupon, CouponAppliesTo, CouponType } from './types';

export interface ListCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateCouponBody {
  code: string;
  description?: string;
  type: CouponType;
  value?: number | null;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  appliesTo: CouponAppliesTo;
  productIds?: string[];
  categoryIds?: string[];
  firstOrderOnly?: boolean;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export interface UpdateCouponBody {
  description?: string;
  value?: number | null;
  maxDiscountAmount?: number | null;
  minOrderAmount?: number | null;
  productIds?: string[];
  categoryIds?: string[];
  firstOrderOnly?: boolean;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export const couponApi = {
  list: (params: ListCouponsParams = {}) =>
    apiFetch<Paginated<Coupon>>(`/admin/coupons${toQueryString(params)}`),
  get: (id: string) => apiFetch<Coupon>(`/admin/coupons/${id}`),
  create: (body: CreateCouponBody) => apiFetch<Coupon>('/admin/coupons', { method: 'POST', body }),
  update: (id: string, body: UpdateCouponBody) =>
    apiFetch<Coupon>(`/admin/coupons/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/admin/coupons/${id}`, { method: 'DELETE' }),
};
