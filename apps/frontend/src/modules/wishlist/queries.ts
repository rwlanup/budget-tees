'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth-store';
import { cartKeys } from '@/modules/cart/queries';
import { wishlistApi, type MoveToCartBody } from './api';
import type { WishlistState } from './types';

export const wishlistKeys = {
  all: ['wishlist'] as const,
  list: ['wishlist', 'list'] as const,
  contains: (skuId: string) => ['wishlist', 'contains', skuId] as const,
};

/** Whether the visitor is authenticated (wishlist requires login). */
export function useIsAuthed(): boolean {
  return !!useAuthStore((s) => s.refreshToken);
}

export function useWishlist(enabled = true) {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: wishlistKeys.list,
    queryFn: () => wishlistApi.list(),
    enabled: enabled && authed,
    staleTime: 30_000,
  });
}

export function useWishlistContains(skuId: string, enabled = true) {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: wishlistKeys.contains(skuId),
    queryFn: () => wishlistApi.contains(skuId),
    enabled: enabled && authed && !!skuId,
    staleTime: 30_000,
  });
}

export function useAddWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skuId: string) => wishlistApi.add(skuId),
    onSuccess: (_data, skuId) => {
      qc.setQueryData<WishlistState>(wishlistKeys.contains(skuId), { wishlisted: true });
      qc.invalidateQueries({ queryKey: wishlistKeys.list });
    },
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skuId: string) => wishlistApi.toggle(skuId),
    onSuccess: (data, skuId) => {
      qc.setQueryData<WishlistState>(wishlistKeys.contains(skuId), data);
      qc.invalidateQueries({ queryKey: wishlistKeys.list });
    },
  });
}

export function useRemoveWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skuId: string) => wishlistApi.remove(skuId),
    onSuccess: (_data, skuId) => {
      qc.setQueryData<WishlistState>(wishlistKeys.contains(skuId), { wishlisted: false });
      qc.invalidateQueries({ queryKey: wishlistKeys.list });
    },
  });
}

export function useMoveToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skuId, body }: { skuId: string; body: MoveToCartBody }) =>
      wishlistApi.moveToCart(skuId, body),
    onSuccess: (cart) => {
      qc.setQueryData(cartKeys.all, cart);
      qc.invalidateQueries({ queryKey: wishlistKeys.list });
    },
  });
}
