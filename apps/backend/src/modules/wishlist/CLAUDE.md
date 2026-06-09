# Wishlist Module

Per-user saved products (auth only). Single `wishlist_products` table (no parent wishlist row, per design change).

## Key files
- `entities/wishlist-product.entity.ts` — unique `(userId, productId)`.
- `wishlist.service.ts` — `list` (priced via default SKU + SaleResolver), `add` (idempotent), `toggle`, `contains`, `remove`, `moveToCart`.

## Conventions / gotchas
- All scoped by `userId` (`wishlist.manage.own`); no IDOR.
- `add` is idempotent (no 409); `toggle` flips and returns `{wishlisted}` for heart icon.
- Only published products addable; `list` skips now-unpublished/deleted products.
- `moveToCart` validates the SKU belongs to the product, delegates to `CartService.addItem({userId})`, optionally removes from wishlist.
- Cascade-deleted with user/product.

## Dependencies
- Depends on: Product, SKU, Product Sale, Cart, Auth.
- Depended on by: storefront heart state; Email (back-in-stock later).
