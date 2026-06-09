# Category Module

Hierarchical product taxonomy for navigation, breadcrumbs, filtering, SEO.

## Implementation note (deviation from design)
Design specified a **closure table**. Implemented as an **adjacency list** (self-referencing `parentId`) + **recursive CTEs** for subtree/ancestors. Reason: hand-written migrations + TypeORM's `@Tree('closure-table')` internals are fragile together; adjacency+CTE is reliable and behaviorally identical (tree, breadcrumb, subtree, cycle-safe moves). If you later need closure-table performance, add a closure table without changing the public API.

## Key files
- `entities/category.entity.ts` — `parentId` self-FK (`ON DELETE RESTRICT`), `parent`/`children` relations.
- `category.service.ts` — `tree()` (in-memory nest), `ancestors()`/`descendantIds()` (recursive CTE), `move()` (cycle check), `reorder()`, `remove(cascade)`.

## Conventions / gotchas
- Column `parentId` is camelCase → **must be quoted** in raw CTE SQL (`c."parentId"`).
- Slug auto from name, unique-suffixed (`uniqueSlug`); preserved on rename unless slug explicitly passed.
- `move()` rejects moving a node under its own descendant (cycle) and self-parent.
- `remove()` blocks if children exist unless `?cascade=true` (deletes whole subtree). `parentId` is RESTRICT.
- `imageMediaId` validated via `MediaService.assertReady`; FK SET NULL.
- Public reads (`tree`/`list`/`findOne`/`ancestors`/`children`) `@Public`; writes `category.manage`.
- `:idOrSlug` route resolves by uuid or slug.

## Dependencies
- Depends on: Media (image), Auth.
- Depended on by: Product (categoryId), Coupon/Sale (category scoping), Featured/storefront nav.
