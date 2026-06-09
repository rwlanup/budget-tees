# Order Module (integration hub)

Converts a cart into an immutable order: validate → snapshot → reserve → total (sale → coupon → shipping → tax) → persist. **Decoupled from Payment** — checkout creates a PENDING order; the client then calls `POST /payments/initiate`. Payment calls back into Order's hooks.

## Key files
- `services/checkout.service.ts` — the big transaction. Reserves stock (`InventoryService.reserve`, locked, same txn), redeems coupon, marks cart CONVERTED, generates `orderNumber` via `order_number_seq`.
- `services/order.service.ts` — list/detail/cancel + **hooks called by Payment/Returns**: `onPaymentSuccess` (PAID+CONFIRMED, commit stock), `onPaymentFailure` (FAILED+CANCELLED, release + coupon reverse), `markCodConfirmed` (commit at placement), `markPaid`, `markRefunded`.
- `services/order-status.service.ts` — transition state machine (branches DELIVERY vs PICKUP) + history.

## Conventions / gotchas
- **Money (tax-inclusive):** `grandTotal = subtotal − discountTotal + shippingCost`. Tax is **extracted** (in subtotal), stored as `taxTotal` + per-line `taxAmount` — NOT added. Round-half-up via money util.
- Prices/sale/coupon/shipping/tax all **server-computed** at checkout; client sends address/method/coupon code only.
- Discount allocated across lines proportionally by line share of subtotal (simplification; eligibility gate is exact in Coupon).
- **Locking + eager items:** never lock with eager join (FOR UPDATE can't span the items outer join). `lock()` locks the order row via QueryBuilder, then loads `items` separately.
- Hooks are **idempotent** (e.g. `onPaymentSuccess` returns if already PAID) — safe for repeated payment callbacks.
- Cancel: PENDING → release reserved; CONFIRMED/PROCESSING → returnStock (already committed); always reverse coupon.
- Guest checkout NOT enabled (requires `order.create.own`); add a guest path later if needed.
- Variant/imageUrl snapshots currently null — wire SKU attribute values + primary media if you want them on the line.
- This migration adds the deferred **`coupon_redemptions.orderId → orders` FK**.

## Dependencies
- Depends on: Cart, Product, SKU(Inventory), Product Sale, Tax, Location, Category, Coupon, Settings, Auth.
- Depended on by: Payment (hooks), Returns, Email, reporting.
