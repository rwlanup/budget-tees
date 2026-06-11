/**
 * Guest cart token persistence. The backend cart is keyed by `userId` (logged-in)
 * or an `x-cart-token` header (guest). We persist the server-issued token so a
 * guest's cart survives reloads; it is merged into the user cart on login (P2).
 */
const KEY = 'bt-cart-token';

export function getCartToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(KEY);
}

export function setCartToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(KEY, token);
}

export function clearCartToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
}
