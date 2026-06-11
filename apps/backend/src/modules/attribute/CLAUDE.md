# Attributes Module

Global reusable attributes (Color, Size, Material) + values. Products opt into a subset; variation attributes drive SKU generation.

## Key files

- `entities/attribute.entity.ts` — `attributes` (name citext unique, `type`, `isVariation`, `isFilterable`); `values` eager.
- `entities/attribute-value.entity.ts` — `attribute_values`, unique `(attributeId, value|slug)`.
- `entities/product-attribute.entity.ts` — `product_attributes` assignment (unique `(productId, attributeId)`, per-product `isVariation` override).
- `entities/product-attribute-value.entity.ts` — `product_attribute_values` (which values apply, composite PK).
- `services/attribute.service.ts` — global CRUD (delete guarded → 409 if in use).
- `services/product-attribute.service.ts` — `setForProduct` (txn replace), `getVariationAxes(productId)` → **consumed by SKU module for combo generation**.

## Conventions / gotchas

- Only `SELECT`/`MULTISELECT`/`COLOR` (`VARIATION_TYPES`) may be variation axes; validated in `setForProduct`.
- `setForProduct` validates every `valueId` belongs to its attribute before writing; replaces the whole assignment in a transaction (cascade clears `product_attribute_values`).
- `getVariationAxes` returns variation attributes + chosen value ids — the cartesian inputs for SKU generation (m12).
- `meta` jsonb on values holds swatch hex/image for COLOR.
- Attribute/value delete blocked by FK RESTRICT from `product_attributes` / `product_attribute_values` (and later `sku_attribute_values`).

## Dependencies

- Depends on: Product (assignment target), Auth.
- Depended on by: SKU & Variants (variation axes), storefront filtering.
