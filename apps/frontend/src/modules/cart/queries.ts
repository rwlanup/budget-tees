'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth/auth-store';
import { getCartToken } from '@/lib/storefront/cart-token';
import { cartApi } from './api';
import type { AddItemBody, PricedCart } from './types';

export const cartKeys = {
  all: ['cart'] as const,
};

export function useCart() {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  // Avoid minting an empty guest cart on every visit — only fetch once a cart
  // exists (token persisted) or the user is logged in. Mutations seed the cache.
  const [hasGuestCart, setHasGuestCart] = React.useState(false);
  React.useEffect(() => setHasGuestCart(!!getCartToken()), []);

  return useQuery({
    queryKey: cartKeys.all,
    queryFn: () => cartApi.get(),
    enabled: hasGuestCart || !!refreshToken,
    staleTime: 15_000,
  });
}

/** Item count for the header badge (0 while loading / empty). */
export function useCartCount(): number {
  const { data } = useCart();
  return data?.itemCount ?? 0;
}

function useCartMutation<TArgs>(fn: (args: TArgs) => Promise<PricedCart>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => qc.setQueryData(cartKeys.all, cart),
  });
}

export function useAddToCart() {
  return useCartMutation((body: AddItemBody) => cartApi.addItem(body));
}

export function useUpdateCartItem() {
  return useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) =>
    cartApi.updateItem(itemId, quantity),
  );
}

export function useRemoveCartItem() {
  return useCartMutation((itemId: string) => cartApi.removeItem(itemId));
}
