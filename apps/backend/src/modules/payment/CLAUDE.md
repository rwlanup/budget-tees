# Payment Module

eSewa / Khalti / COD. Server-side verification only; drives Order via verified hooks. Manual (admin-recorded) refunds.

## Key files
- `gateways/payment-gateway.interface.ts` — `PaymentGateway` (initiate/verify).
- `gateways/esewa.gateway.ts` — ePay v2: signed (HMAC-SHA256) form POST; verify decodes base64 `data` + checks signature + status COMPLETE.
- `gateways/khalti.gateway.ts` — server `initiate` (fetch) → `payment_url`+`pidx`; verify via `lookup` by pidx (status Completed).
- `payment.service.ts` — `initiate` (COD → cap check + `markCodConfirmed`; online → gateway redirect), `handleCallback` (verify → Order hooks, idempotent, logs `payment_events`), `markCodPaid`.
- `refund.service.ts` — manual refund: caps at refundable, updates payment + `OrderService.markRefunded`.

## Conventions / gotchas
- **Never trust client redirect params** — `verify` re-checks signature (eSewa) / server lookup (Khalti). `gatewayRef` = eSewa `transaction_uuid` (= payment.id) / Khalti `pidx`.
- **Order is decoupled:** Payment imports OrderModule and calls `onPaymentSuccess` / `onPaymentFailure` / `markCodConfirmed` / `markPaid` / `markRefunded`. Order never imports Payment.
- Callbacks **idempotent** (returns if already SUCCESS); every callback logged to `payment_events` (append-only).
- Amount always from the order (`order.grandTotal`), never the client.
- COD: confirms order + commits stock at placement (`markCodConfirmed`); `mark-paid` settles on delivery/pickup.
- Gateway secrets via `payment.*` config (env); test defaults point at eSewa RC / Khalti dev. Set real keys + `PAYMENT_RETURN_URL` for prod.
- Reuses `payment_method_enum` created by the Order migration.
- Callbacks return JSON; a real frontend flow would redirect to a success/failure page.

## Dependencies
- Depends on: Order (hooks), Settings (COD cap), gateways (env), Auth.
- Depended on by: Returns (refund linkage), reporting.
