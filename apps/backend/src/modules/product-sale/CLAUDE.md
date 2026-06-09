# Product Sale Module

Time-bound automatic discounts (no code). Scope: products / categories(+descendants) / store-wide. When multiple active sales match, the **lowest price wins** (best for customer). This is the unit price Cart/Order read; Coupon stacks on top.

## Key files
- `entities/sale.entity.ts` — `sales` (type, value, maxDiscountAmount, scope, window, isActive).
- `entities/sale-links.entity.ts` — `sale_products` / `sale_categories` / `sale_excluded_products`.
- `services/sale.service.ts` — CRUD (validates %≤100, endsAt>startsAt, scope arrays); `activeSales()`.
- `services/sale-resolver.service.ts` — **`resolveForProduct(productId, basePrice)`** → `{salePrice, onSale, sourceSaleId, discountPct, saleEndsAt}`.

## Conventions / gotchas
- **Resolution** gathers active (in-window) sales, matches by scope, computes each candidate price, returns the lowest. Category match uses the product's category **lineage** (self + ancestors via `CategoryService.ancestors`) intersected with `sale_categories`.
- STORE_WIDE matches everything except `sale_excluded_products`; CATEGORIES also honors exclusions.
- Price floored at 0; round-half-up.
- `SaleResolverService` is the dependency Cart/Order use for live unit price — **replaces the deferred stub noted in Cart**.
- No SKU-level scope (per design); a product sale applies to all its SKUs.
- Order snapshots the resolved sale price on the line at placement (later edits don't change placed orders).
- No cache yet — resolution does ~3 link queries per product; add Redis cache keyed by productId if hot.

## Dependencies
- Depends on: Product, Category, Auth.
- Depended on by: Cart (unit price), Order (snapshot), Coupon (computes on sale price), Featured/storefront badges.
