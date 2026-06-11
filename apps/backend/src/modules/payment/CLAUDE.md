# Payment Module

eSewa / COD. Server-side verification only; drives Order via verified hooks. Manual (admin-recorded) refunds. (Khalti removed — migration `…029` dropped it from `payment_method_enum`.)

## Key files

- `gateways/payment-gateway.interface.ts` — `PaymentGateway` (`initiate` / `verifyCallback` / `checkStatus`).
- `gateways/esewa.gateway.ts` — **eSewa ePay v2**: `initiate` builds a signed (HMAC-SHA256 base64 over `total_amount,transaction_uuid,product_code`) **form POST** to the ePay form URL (no server call); `verifyCallback` decodes the success redirect's base64 `data`, re-derives the signature over its `signed_field_names`, maps `status` (COMPLETE→SUCCESS); `checkStatus` GETs the transaction status API by `product_code`+`total_amount`+`transaction_uuid`. `transaction_uuid` = `payment.id` = `gatewayRef`.
- `payment.service.ts` — `initiate` (COD → cap check + `markCodConfirmed`; eSewa → local sign, `gatewayRef`=payment.id, return form POST), `handleCallback` (verify signed `data` → `applyStatus`), `reconcileOrderPayment` (active status check while settling; used by result page), `applyStatus` (shared settler → Order hooks, idempotent), `markOrderPaid` (admin: settle/create SUCCESS row → `onPaymentSuccess`).
- `refund.service.ts` — manual refund: caps at refundable, updates payment + `OrderService.markRefunded`.

## Conventions / gotchas

- **eSewa ePay flow:** signed form POST → shopper pays → eSewa redirects the browser (GET) to `success_url`/`failure_url` = `/api/payments/esewa/callback` (`@Public`); the controller verifies the signed `data`, settles via `applyStatus`, then 302s the browser to `{websiteUrl}/checkout/result?order=…&status=…`. The result page also polls `GET /payments/order/:idOrNumber/status` to actively reconcile (covers a dropped redirect). `gatewayRef` = `transaction_uuid` = `payment.id` (callback lookup key).
- **`success_url`/`failure_url` (`PAYMENT_RETURN_URL`, include `/api`)** must be reachable by the shopper's browser. Settlement never trusts the redirect blindly — it verifies the `data` signature, and the status-check API is authoritative for the reconcile poll.
- **Payments table is the source of truth for payment status.** `order.paymentStatus` is a derived cache recomputed from payment rows (`OrderService.recomputePaymentStatus`) after every mutation here. There IS now a relation/FK `payments.orderId → orders.id` (`Order.payments`); Payment still imports OrderModule (DI), Order reads payments only via the entity relation (no Payment injection).
- **Order is decoupled:** Payment imports OrderModule and calls `onPaymentSuccess` / `onPaymentFailure` / `markCodConfirmed` / `markRefunded`. Order never imports PaymentModule.
- **`markOrderPaid`** (admin, all methods — COD cash / offline transfer): guards (already-paid / refunded / cancelled), settles the latest payment row to SUCCESS (creates one if none), then `onPaymentSuccess` → PENDING orders auto-CONFIRM + commit stock; later statuses unchanged.
- Callbacks **idempotent** (returns if already SUCCESS); every callback logged to `payment_events` (append-only).
- Amount always from the order (`order.grandTotal`), never the client.
- COD: confirms order + commits stock at placement (`markCodConfirmed`); `mark-paid` settles on delivery/pickup.
- Gateway secrets via `payment.*` config (env): `ESEWA_SECRET` = merchant **secret key** (HMAC-SHA256 signing key), `ESEWA_PRODUCT_CODE`, `ESEWA_FORM_URL`, `ESEWA_STATUS_URL`. Defaults = ePay UAT (`EPAYTEST` / `8gBm/:&EnhH.1/q` / RC URLs); set prod product code + secret + prod URLs for prod.
- Reuses `payment_method_enum` created by the Order migration.

## Dependencies

- Depends on: Order (hooks), Settings (COD cap), gateways (env), Auth.
- Depended on by: Returns (refund linkage), reporting.
