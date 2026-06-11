# Wishlist Module

Per-user saved **variants** (auth only). Single `wishlist_products` table (no parent wishlist row). Keyed by SKU, not product, so a customer can save a specific variant.

## Key files

- `entities/wishlist-product.entity.ts` — unique `(userId, skuId)`; also stores `productId` (denormalized, for PDP links + unpublish-skip).
- `wishlist.service.ts` — `list` (priced via the saved SKU + SaleResolver; title = `sku.name`), `add`/`toggle`/`contains`/`remove` (all by `skuId`), `moveToCart`.

## Conventions / gotchas

- All scoped by `userId` (`wishlist.manage.own`); no IDOR.
- **SKU-keyed** (migration `…026` swapped uniqueness from `(user, product)` → `(user, sku)`, backfilling existing rows from `products.defaultSkuId` and dropping rows with no default SKU).
- `add` idempotent (no 409); `toggle` flips and returns `{wishlisted}` for the heart icon. Both validate the SKU is active + on a published product (`assertSellable`).
- `list` skips rows whose product is now unpublished/deleted or whose SKU is gone; price/stock come from the saved SKU.
- `moveToCart` adds the saved SKU to the cart (skuId now comes from the path, not the body) and optionally removes the wishlist row.
- Cascade-deleted with user / product / **sku** (FK `fk_wishlist_sku` ON DELETE CASCADE).

## API
`POST /wishlist/items {skuId}` · `POST /wishlist/toggle {skuId}` · `GET /wishlist/contains/:skuId` · `POST /wishlist/items/:skuId/move-to-cart {quantity, removeFromWishlist?}` · `DELETE /wishlist/items/:skuId`.

## Dependencies

- Depends on: Product, SKU, Product Sale, Cart, Auth.
- Depended on by: storefront heart state (variant-card + PDP); Email (back-in-stock later).
