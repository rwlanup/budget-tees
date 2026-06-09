# Cart Module

Persistent (Postgres) cart for guests and logged-in users, with guest→user merge on login. Prices computed **live** (sale-adjusted); no stock reserved here.

## Key files
- `entities/cart.entity.ts` — `carts` (nullable `userId` / `token`, `status`); items eager.
- `entities/cart-item.entity.ts` — `cart_items`, unique `(cartId, skuId)`.
- `cart.service.ts` — `resolveOrCreate(ctx)`, add/update/remove/clear, `merge`, `getActiveForUser` + `markConverted` (for Order).
- `cart-pricing.service.ts` — `price(cart)`: per-line live unit price via `SaleResolverService`, availability via SKU, flags `unavailable` lines.

## Conventions / gotchas
- **Auth:** cart routes use `@OptionalAuth()` (added to common + JwtAuthGuard) — logged-in → `userId`; guest → `x-cart-token` header. The response echoes `token` so the client can persist a guest cart. `/cart/merge` requires auth.
- One active cart per user / per token — partial unique indexes enforce it.
- **No price stored** on cart items → always current; **no stock reserved** (reservation happens at Order placement).
- Add validates SKU active + product published; quantities capped at `MAX_PER_ITEM` (99).
- Merge sums quantities (dedupe by skuId, capped), marks guest cart `MERGED`. Call from Auth post-login or `POST /cart/merge`.
- `unavailable` lines (SKU deactivated / unpublished) excluded from subtotal; checkout must reject them.

## Dependencies
- Depends on: SKU, Product, Product Sale, Auth.
- Depended on by: Order (checkout source), Wishlist (move-to-cart), Email (abandoned-cart later).
