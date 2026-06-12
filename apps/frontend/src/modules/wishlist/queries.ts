'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth-store';
import { cartKeys } from '@/modules/cart/queries';
import { wishlistApi, type MoveToCartBody } from './api';
import type { WishlistState } from './types';

export const wishlistKeys = {
  all: ['wishlist'] as const,
  list: ['wishlist', 'list'] as const,
  count: ['wishlist', 'count'] as const,
  contains: (skuId: string) => ['wishlist', 'contains', skuId] as const,
};

/** Invalidate the list + badge count after any wishlist mutation. */
function invalidateWishlist(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: wishlistKeys.list });
  qc.invalidateQueries({ queryKey: wishlistKeys.count });
}

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

export function useWishlistCountQuery(enabled = true) {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: wishlistKeys.count,
    queryFn: () => wishlistApi.count(),
    enabled: enabled && authed,
    staleTime: 30_000,
  });
}

/** Saved-item count for the header badge (0 while loading / guest / empty). */
export function useWishlistCount(): number {
  const { data } = useWishlistCountQuery();
  return data?.count ?? 0;
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
      invalidateWishlist(qc);
    },
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skuId: string) => wishlistApi.toggle(skuId),
    onSuccess: (data, skuId) => {
      qc.setQueryData<WishlistState>(wishlistKeys.contains(skuId), data);
      invalidateWishlist(qc);
    },
  });
}

export function useRemoveWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (skuId: string) => wishlistApi.remove(skuId),
    onSuccess: (_data, skuId) => {
      qc.setQueryData<WishlistState>(wishlistKeys.contains(skuId), { wishlisted: false });
      invalidateWishlist(qc);
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
      invalidateWishlist(qc);
    },
  });
}
