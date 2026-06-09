# Product Module

Catalog spine — descriptive/SEO/relationship data. **Holds no price/stock** (those live on SKU, m12). Owns the `product_tags` and `product_media` join tables.

## Key files
- `entities/product.entity.ts` — `products`; `category`/`brand` eager, `tags` eager M:N (`product_tags`). `taxClassId` + `defaultSkuId` are plain uuid columns (FKs added in Tax/SKU migrations). Soft-delete via `deletedAt`.
- `entities/product-media.entity.ts` — `product_media` gallery (composite PK).
- `product.service.ts` — CRUD, list (filters: category+descendants, brand, tag, search, sort), publish guard, soft delete, `setDefaultSku` (called by SKU module).
- `product-media.service.ts` — gallery get/replace (one primary, media must be READY).

## Conventions / gotchas
- **Publish guard** (`setStatus` → PUBLISHED): requires ≥1 active SKU, checked via raw SQL on `skus` (`hasActiveSku`, try/catch → false if table absent). No SKU import → no module cycle.
- `product_tags` (created here) is also used by Tag's `merge`. `product_media.mediaId` is RESTRICT; `categoryId`/`brandId` RESTRICT.
- Slug auto + unique among non-deleted (partial index); uniqueness check uses `withDeleted`.
- Category must be active on assign; brand must be active (`brands.assertActive`).
- Public list/detail = PUBLISHED only; `/admin/products` sees all incl draft/archived.
- Price/priceRange enrichment intentionally NOT here yet — add by joining `skus` after m12 if needed.
- `defaultSkuId`/`taxClassId` FK constraints come from later migrations; columns exist from m10.

## Dependencies
- Depends on: Category, Brand, Tag, Media, Auth.
- Depended on by: SKU, Attributes, Sale, Cart, Wishlist, Order, Coupon, Featured.
