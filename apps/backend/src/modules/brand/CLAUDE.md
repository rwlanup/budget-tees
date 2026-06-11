# Brand Module

Manufacturer/brand catalog, FK-linked to products (`product.brandId`, nullable). Powers brand filtering + brand pages.

## Key files

- `entities/brand.entity.ts` — `brands`: `name` citext unique, `slug` unique, `logoMediaId` FK SET NULL, `websiteUrl`, `isActive`.
- `brand.service.ts` — CRUD; `assertActive(id)` used by Product when assigning `brandId`.

## Conventions / gotchas

- Name unique (citext); slug auto + unique-suffixed.
- `websiteUrl` restricted to http/https (`@IsUrl`).
- `logoMediaId` validated via `MediaService.assertReady`.
- Delete blocked by FK RESTRICT on `product.brandId` → caught as 409. Prefer `isActive=false`.
- `product.brandId` FK is created in the **Product migration** (m10).
- Public list returns active only; `/admin/brands` returns all.

## Dependencies

- Depends on: Media (logo), Auth.
- Depended on by: Product (brandId), storefront brand filter.
