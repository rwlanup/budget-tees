# Order Returns Module

Per-item partial returns; resolutions: **refund** (manual, via Payment) or **exchange**. Drives restocking + order/payment status.

## Key files

- `entities/return-request.entity.ts` / `return-item.entity.ts` — items eager.
- `return.service.ts` — `create` (eligibility + provisional refund), `review`, `receive` (condition + restock flags), `resolve` (restock + refund/exchange), `returnable`.

## Flow / gotchas

- Lifecycle: REQUESTED → (review) APPROVED→AWAITING_ITEMS / REJECTED → (receive) RECEIVED → (resolve) COMPLETED. Customer can cancel only at REQUESTED.
- **Eligibility:** order in DELIVERED/PICKED_UP, paymentStatus PAID, within `returns.windowDays` (Settings). Window measured from `order.updatedAt` (proxy for delivered time — refine with status-history timestamp if needed).
- **Returnable qty** per line = ordered − already-returned (sum across non-rejected/cancelled requests, raw SQL).
- Provisional refund per line = proportional `orderItem.lineTotal × qty/orderedQty`.
- **Resolve:** restocks `restock=true` items via `InventoryService.returnStock` (txn). REFUND → finds captured payment (`PaymentService.findCapturedByOrder`) → `RefundService.refund` (caps refundable, updates order); COD/no-payment → `OrderService.markRefunded` directly. EXCHANGE → reserves+commits the exchange SKU; records `priceDifference` (simplified — no separate replacement Order entity yet).
- Refund amounts server-computed + admin-capped; condition gates restock (damaged goods don't re-enter sellable stock).
- `return_number_seq` generates `RET-YYYY-NNNNNN`.

## Dependencies

- Depends on: Order, SKU(Inventory), Payment (RefundService + findCapturedByOrder), Settings, Auth.
- Depended on by: reporting; Email (return notifications later).
