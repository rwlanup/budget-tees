# Review Module

Verified-buyer product reviews. One review per `(user, product)`. Public read; write gated by purchase.

## Key files

- `entities/product-review.entity.ts` — `product_reviews`; unique `(userId, productId)`; `rating` smallint 1–5 (DB CHECK); `status` PUBLISHED/HIDDEN; `orderId` = the purchase that unlocked it (SET NULL).
- `review.service.ts` — summary (avg/count/distribution), public list (+author "First L."), getMine (+eligibility), CRUD-own, admin moderation.
- `review.controller.ts` — `/reviews`: public `product/:productId` + `.../summary`; auth `me/:productId`, `POST`, `PATCH/:id`, `DELETE/:id` (own).
- `admin-review.controller.ts` — `/admin/reviews` (`review.manage`): list, `PATCH /:id/status` (hide/publish), `DELETE /:id`.

## Conventions / gotchas

- **Buyer gate** (`purchaseOrderId`): requires an `order_items` row for the product on an order owned by the caller in status `DELIVERED`/`PICKED_UP` (received). Else `POST` → 403.
- One per product: second `POST` → 409; edit via `PATCH` instead.
- Author name is `firstName + lastInitial` only (no email/full name leaked publicly).
- Public read = PUBLISHED only; HIDDEN reviews stay visible to their author via `getMine`.
- Permissions `review.create.own` (customer) + `review.manage` (admin) auto-seed from `permissions.ts` on boot.
- No product-entity aggregate column — summary computed on read (group-by). Add a denormalized cache if PDP read load grows.

## Dependencies

- Depends on: Product (publish check), Order (purchase proof via `order_items`/`orders`), User (author name), Auth.
- Depended on by: storefront PDP (stars + list + form).
