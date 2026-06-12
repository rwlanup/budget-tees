# Notification Module

In-app notifications for customers + admins. **Event-driven, decoupled** — mirrors the email
system: business flows emit a fire-and-forget `notification.dispatch` event; a listener resolves
recipients, suppresses self-notifications, dedupes, and persists. No business module imports this
one (it only reads `User` to fan admin notifications out by permission).

## Key files

- `entities/notification.entity.ts` — `notifications`, **one row per recipient user** (admin events fan out). `isSeen`/ownership are per-user. Enum-ish columns are `varchar` (extensible without enum migrations). Indexes: `(recipientId, createdAt)`, `(recipientId, isSeen)`, partial unique `(recipientId, deduplicationKey)`.
- `notification-event.ts` — `NotificationEvent` shape + `NOTIFICATION_DISPATCH` channel + `emitNotification(events, event)` (the producer-side util, like `emitEmail`).
- `notification.planner.ts` — **pure** `planNotifications(event, adminIds)` → rows to insert. Self-notification suppression (`recipientId === actorId`), titles/messages, routes, and dedup keys live here. Unit-tested (`notification.planner.spec.ts`, Node test runner — `pnpm test`).
- `notifications.service.ts` — `dispatch(event)` (resolve admin recipients by permission → plan → bulk `insert().orIgnore()` for dedup; errors are logged, never thrown back into the business txn) + per-user `list` / `unseenCount` / `markSeen` / `markAllSeen`.
- `notification.listener.ts` — `@OnEvent('notification.dispatch')` → `service.dispatch`.
- `notification.controller.ts` — `/notifications` (auth only, no permission). Every query scoped to `recipientId = currentUser.id`.

## Triggers (where producers emit)

| Event | Emitted from | Recipients (actor excluded) |
| --- | --- | --- |
| `ORDER_PLACED` | `CheckoutService.checkout` (post-commit) | admins (`order.manage`) |
| `ORDER_STATUS_UPDATED` | `OrderService.emitConfirmation` / `emitStatusUpdate` | customer |
| `PAYMENT_STATUS_UPDATED` | `PaymentService.applyStatus` (SUCCESS/FAILED/REVERTED) + `markOrderPaid`; `RefundService.refund` | customer + admins (`payment.manage`) |
| `RETURN_CREATED` / `RETURN_CANCELLED` | `ReturnService.create` / `cancel` | admins (`return.manage`) |
| `RETURN_STATUS_UPDATED` | `ReturnService.emitUpdate` (review/receive/resolve) | customer |
| `CONTACT_SUBMITTED` | `ContactService.create` | admins (`contact.manage`) |
| `LOW_STOCK` | `InventoryService.adjust` on threshold crossing (post-commit) | admins (`sku.manage`) |

## Conventions / gotchas

- **Self-notification rule is centralized** in the planner: a row is dropped when `recipientId === actorId`. Producers always pass the acting user as `actorId`.
- **Dedup is DB-enforced**: `insert().orIgnore()` (ON CONFLICT DO NOTHING) against the unique `(recipientId, deduplicationKey)` index — concurrency-safe, collapses repeated events from one business action. State-encoded keys (e.g. `order-status:<id>:<STATUS>`) dedupe per state; `low-stock:<skuId>` has no state so an unresolved SKU only alerts once.
- **Emit only post-commit.** Listener DB work runs async after the producer returns; emitting inside a txn that may roll back could persist a stray row. `notifications` has no FK to business tables, so the listener never reads uncommitted rows.
- **Low stock** triggers on `adjust` (admin stock edit) crossing `available <= lowStockThreshold` (the existing low-stock predicate). Sale-driven crossings (reserve/commit inside order txns) are intentionally not emitted — avoids rollback false-positives + checkout spam. (Future: post-commit hook.)
- **Routing**: customer → `/account/orders/:orderNumber`; admin order/payment → `/admin/orders/:id`; admin return → `/admin/returns/:id`; contact → `/admin/contact-messages` (list — no detail page); low stock → `/admin/skus`.
- **Notifications require login** but no permission — the controller scopes to `recipientId = currentUser.id`, so customers see only their rows and admins only their admin rows. No IDOR.

## Dependencies

- Depends on: User (read, for admin fan-out), global `EventEmitterModule`. No business module depends on this one.
- Depended on by: storefront header + admin top-bar notification bell (frontend).
