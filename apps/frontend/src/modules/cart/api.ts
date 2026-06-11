import { apiFetch } from '@/lib/api/client';
import { getCartToken, setCartToken } from '@/lib/storefront/cart-token';
import type { AddItemBody, PricedCart } from './types';

const TOKEN_HEADER = 'x-cart-token';

function tokenHeaders(): Record<string, string> {
  const token = getCartToken();
  return token ? { [TOKEN_HEADER]: token } : {};
}

/** Persist the server-echoed guest token so the cart survives reloads. */
function capture(cart: PricedCart): PricedCart {
  if (cart.token) setCartToken(cart.token);
  return cart;
}

export const cartApi = {
  get: () => apiFetch<PricedCart>('/cart', { headers: tokenHeaders() }).then(capture),

  addItem: (body: AddItemBody) =>
    apiFetch<PricedCart>('/cart/items', {
      method: 'POST',
      body,
      headers: tokenHeaders(),
    }).then(capture),

  updateItem: (itemId: string, quantity: number) =>
    apiFetch<PricedCart>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: { quantity },
      headers: tokenHeaders(),
    }).then(capture),

  removeItem: (itemId: string) =>
    apiFetch<PricedCart>(`/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: tokenHeaders(),
    }).then(capture),

  /** Merge a guest cart (by token) into the logged-in user's cart. Requires auth. */
  merge: (token: string) =>
    apiFetch<PricedCart>('/cart/merge', { method: 'POST', body: { token } }),
};
