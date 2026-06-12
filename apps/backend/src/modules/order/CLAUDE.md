# Order Module (integration hub)

Converts a cart into an immutable order: validate → snapshot → reserve → total (sale → coupon → shipping → tax) → persist. **Decoupled from Payment** — checkout creates a PENDING order; the client then calls `POST /payments/initiate`. Payment calls back into Order's hooks.

## Key files

- `services/checkout.service.ts` — the big transaction. Reserves stock (`InventoryService.reserve`, locked, same txn), redeems coupon, marks cart CONVERTED, generates `orderNumber` via `order_number_seq`.
- `services/order.service.ts` — list/detail/cancel + **hooks called by Payment/Returns**: `onPaymentSuccess` (commit stock + PENDING→CONFIRMED on first capture, else status untouched), `onPaymentFailure` (PENDING→CANCELLED, release + coupon reverse), `markCodConfirmed` (commit at placement), `markRefunded` (status→REFUNDED if full), `recomputePaymentStatus` (the single writer of `order.paymentStatus`).
- `services/order-status.service.ts` — transition state machine (branches DELIVERY vs PICKUP) + history.
- `services/invoice.service.ts` — order invoice PDF (pdfkit, standard Helvetica fonts, no headless browser); store name/support email from Settings. Reads `ReturnRequest` (repo registered in `OrderModule` `forFeature` — entity-only, no `ReturnModule` import → no circular DI) to list any returns + status on the invoice. Streamed via `sendInvoice` (exported from `order.controller.ts`) — customer `GET /orders/:idOrNumber/invoice` (own) + admin `GET /admin/orders/:id/invoice`.

## Conventions / gotchas

- **Payment status is a derived projection.** The **payments table is the single source of truth**; `order.paymentStatus` (+ `paidAt`) is a denormalized cache that only `recomputePaymentStatus(orderId)` writes — never set it inline. It rolls up the order's `payments[]` by precedence REFUNDED > PARTIALLY_REFUNDED > PAID(SUCCESS) > FAILED > UNPAID. Every payment mutation (success/failure/COD confirm/refund/admin mark-paid) ends by calling it. `Order.payments` is a real relation (FK `payments.orderId → orders.id`, migration `…027`), non-eager; **detail reads** (`adminFindOne`, `findOneForUser`) load + embed it (`adminFindOne` nests each payment's `refunds`; customer reads strip gateway internals + no refunds); **lists stay light** (no payments). The 5-value `order.paymentStatus` ↔ 7-value `payment.status` mapping: SUCCESS→PAID, INITIATED/PENDING/CANCELLED→UNPAID.
- **Admin mark-paid lives in Payment** (`POST /admin/payments/order/:id/mark-paid` → `PaymentService.markOrderPaid`), not Order — settling/creating a SUCCESS payment row is what drives the derived status. It then calls `onPaymentSuccess`, so a PENDING order auto-confirms (+ commits stock); any later status is left unchanged.
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
