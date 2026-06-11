# Featured Product Module

Admin-curated, ordered list of products for the storefront homepage. Single global list (dedicated table — keeps `products` untouched).

## Key files

- `entities/featured-product.entity.ts` — `featured_products`, unique `productId`, `sortOrder`, `isActive`.
- `featured-product.service.ts` — `listPublic` (active + published, priced via default SKU + SaleResolver), admin CRUD + `reorder`.

## Conventions / gotchas

- Public list returns only `isActive` entries whose product is still published; prices resolved live (sale-aware). Now-unpublished products auto-excluded.
- `add` requires published product; duplicate `productId` → 409.
- Reorder bulk-updates `sortOrder` in a transaction.
- Writes `featured.manage`; reads public.

## Dependencies

- Depends on: Product, SKU, Product Sale, Auth.
- Depended on by: storefront homepage.
