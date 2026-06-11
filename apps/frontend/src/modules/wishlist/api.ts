import { apiFetch } from '@/lib/api/client';
import type { PricedCart } from '@/modules/cart/types';
import type { WishlistItem, WishlistState } from './types';

export interface MoveToCartBody {
  quantity: number;
  removeFromWishlist?: boolean;
}

export const wishlistApi = {
  list: () => apiFetch<WishlistItem[]>('/wishlist'),

  add: (skuId: string) =>
    apiFetch<WishlistState>('/wishlist/items', { method: 'POST', body: { skuId } }),

  toggle: (skuId: string) =>
    apiFetch<WishlistState>('/wishlist/toggle', { method: 'POST', body: { skuId } }),

  contains: (skuId: string) => apiFetch<WishlistState>(`/wishlist/contains/${skuId}`),

  remove: (skuId: string) =>
    apiFetch<WishlistState>(`/wishlist/items/${skuId}`, { method: 'DELETE' }),

  moveToCart: (skuId: string, body: MoveToCartBody) =>
    apiFetch<PricedCart>(`/wishlist/items/${skuId}/move-to-cart`, { method: 'POST', body }),
};
