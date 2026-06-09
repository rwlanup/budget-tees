# Tag Module

Flat, cross-cutting product labels (M:N with products). Non-hierarchical (unlike Category).

## Key files
- `entities/tag.entity.ts` — `tags`: `name` citext unique, `slug` unique, `isActive`.
- `tag.service.ts` — CRUD + `merge()` + `resolveByIds()` (used by Product to attach).

## Conventions / gotchas
- `product_tags` join table is **created in the Product migration** (m10), not here. `merge()` runs raw SQL against `product_tags` — only meaningful once Product exists.
- Name unique (case-insensitive via citext); slug auto + unique-suffixed.
- `merge(sourceIds → targetId)`: repoints `product_tags` (ON CONFLICT DO NOTHING dedupe) then deletes source tags, in a transaction. Target can't be among sources.
- Public reads; writes `tag.manage`. `:idOrSlug` resolves by uuid or slug.
- `productCount` not yet returned (needs `product_tags`); add after Product if needed.

## Dependencies
- Depends on: Auth.
- Depended on by: Product (M:N tags + `resolveByIds`), storefront filtering.
