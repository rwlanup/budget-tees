# Coupon Module

Code-based, time-bound discounts — one per order, applied on top of sale prices. Percentage / fixed / free-shipping with eligibility + usage limits.

## Key files

- `entities/coupon.entity.ts` — `coupons` (type, value, caps, scope, limits, `usedCount`, window).
- `entities/coupon-links.entity.ts` — `coupon_products` / `coupon_categories` (scope) + `coupon_redemptions` (ledger).
- `coupon.service.ts` — admin CRUD (delete blocked once redeemed → deactivate).
- `coupon-redemption.service.ts` — **`validateOrThrow(code, ctx)`**, **`redeem(...)`** (locked, usage++), **`reverse(orderId)`** (status→REVERSED, usage--).
- `coupon-context.service.ts` — builds `CouponContext` (lines + category lineage) from the cart for the preview endpoint.

## Conventions / gotchas

- Validation order: active → window → global limit → per-user limit → firstOrderOnly → eligible-subtotal>0 → minOrder. Failures throw 422 `{code, valid:false, reason}` (EXPIRED / USAGE_LIMIT / NOT_ELIGIBLE / MIN_ORDER_NOT_MET …).
- Discount computed on **eligible subtotal** (ALL = whole subtotal; PRODUCTS/CATEGORIES = matching lines). Category match uses each line's **category lineage** (self+ancestors).
- `redeem`/`reverse` lock the coupon row (`pessimistic_write`) → no over-redemption under concurrency; **Order calls them inside its checkout txn** (`redeem`) and on cancel/refund (`reverse`).
- FREE_SHIPPING → discountAmount 0 + `freeShipping` flag (Order zeroes shipping).
- `coupon_redemptions.orderId` has **no FK yet** — added by the Order migration (m19). `firstOrderOnly` checks `orders` via guarded raw SQL.
- Codes case-insensitive (citext); `/coupons/validate` is `@OptionalAuth` + rate-limited globally.

## Dependencies

- Depends on: Cart, Product, Category, Auth (+ Order indirectly via orderId).
- Depended on by: Order (apply discount), Payment/Returns (reverse).
