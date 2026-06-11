# SKU & Variants Module

The sellable unit — holds **price + inventory** for every product. Owns the reserve→commit→release stock lifecycle that Cart/Order/Payment/Returns depend on.

## Key files

- `entities/sku.entity.ts` — `skus`; numeric columns use a transformer (pg returns numeric as string → coerced to number). `available` getter = stock − reserved. `@ManyToOne(() => Product) product` (inverse of `Product.skus`). **Import Product/Sku via relative paths** (`../../product/entities/product.entity`), never bare `src/...` — typeorm CLI ts-node can't resolve `src/` aliases → migration:run fails.
- `entities/sku-attribute-value.entity.ts` — the variant combo (`sku_attribute_values`).
- `entities/stock-movement.entity.ts` — append-only `stock_movements` ledger.
- `services/inventory.service.ts` — **`reserve`/`commit`/`release`/`returnStock`/`adjust`**, each with a `pessimistic_write` row lock + ledger entry. Methods accept an optional `EntityManager` so Order checkout runs them inside its own txn.
- `services/sku.service.ts` — CRUD, `generate()` (cartesian of variation axes from `ProductAttributeService.getVariationAxes`), default-SKU sync.

## Conventions / gotchas

- **Stock model (approved):** reserve on order placement → commit on payment success → release on fail/cancel. `available = stock − reserved`; check constraints keep both ≥0.
- `InventoryService` is the ONLY safe way to mutate stock — never update `stock`/`reserved` directly. Pass the caller's `EntityManager` to stay atomic with the order txn.
- `reserve` throws `{code:INSUFFICIENT_STOCK}` unless `allowBackorder`.
- First SKU created for a product → `isDefault=true` + `ProductService.setDefaultSku`. One default per product (partial unique index).
- SKU **delete blocked** if referenced by `order_items` (FK RESTRICT → 409); deactivate instead. Combos immutable after create (new combo = new SKU).
- `generate` skips combos that already exist (idempotent re-run); `skipExisting` semantics built in.
- This migration also adds the deferred `products.defaultSkuId → skus.id` FK (SET NULL).
- `costPrice` is admin-only data — don't expose publicly.

## Dependencies

- Depends on: Product (`setDefaultSku`, publish check), Attributes (variation axes), Media, Auth.
- Depended on by: Cart, Order (reserve/commit), Payment (commit/release), Returns (returnStock), Sale, Featured.
