'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  couponApi,
  type ListCouponsParams,
  type CreateCouponBody,
  type UpdateCouponBody,
} from './api';

export const couponKeys = {
  all: ['coupons'] as const,
  list: (params: ListCouponsParams) => [...couponKeys.all, 'list', params] as const,
  detail: (id: string) => [...couponKeys.all, 'detail', id] as const,
};

export function useCoupons(params: ListCouponsParams) {
  return useQuery({
    queryKey: couponKeys.list(params),
    queryFn: () => couponApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCoupon(id: string) {
  return useQuery({
    queryKey: couponKeys.detail(id),
    queryFn: () => couponApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCouponBody) => couponApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: couponKeys.all }),
  });
}

export function useUpdateCoupon(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateCouponBody) => couponApi.update(id, body),
    onSuccess: (c) => {
      qc.setQueryData(couponKeys.detail(id), c);
      qc.invalidateQueries({ queryKey: couponKeys.all });
    },
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => couponApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: couponKeys.all }),
  });
}
