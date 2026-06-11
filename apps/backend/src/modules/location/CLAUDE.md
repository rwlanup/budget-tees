# Location Module

Saved addresses + shipping-zone delivery-charge engine + the single store (branding **and** pickup point).

## Key files

- `entities/user-address.entity.ts` — `user_addresses` (type, default per type, `email`, `nearestLandmark`, `countryCode` FK).
- `entities/shipping-zone.entity.ts` — `shipping_zones` (flat rate + `freeShippingThreshold`) + `shipping_zone_regions` (eager).
- `entities/pickup-location.entity.ts` — `pickup_locations` (one active store).
- `services/address.service.ts` — self CRUD; `findOwned` used by Order to snapshot.
- `services/shipping-zone.service.ts` — zone CRUD (regions replaced transactionally).
- `services/pickup.service.ts` — store CRUD; **single active** invariant (activating one deactivates others); `getActive()`.
- `services/shipping-calculator.service.ts` — **`calculate(method, subtotal, country?, region?)`** → `{shippingCost, freeApplied, zone}`.
- `seeds/location.seeder.ts` — store + nationwide NP zone (flat 100, free ≥ 5000).

## Conventions / gotchas

- **Charge rule (approved):** flat rate per zone + free-over-threshold. `PICKUP` → cost 0. `DELIVERY` → validate country in allow-list (Settings), match region-zone (region ∈ zone regions, case-insensitive) else country-wide fallback; no match → 422 `NO_SHIPPING_ZONE`; unsupported country → 422 `COUNTRY_NOT_SUPPORTED`.
- `ShippingCalculatorService.calculate` **replaces Order's shipping stub**.
- Addresses scoped by `userId` (no IDOR); one default per `type` (partial unique index).
- Pickup doubles as branding (`GET /pickup-locations`) and order pickup (`getActive`).
- Order snapshots the chosen address/pickup (FK-free history); these tables are the source for prefill only.

## Dependencies

- Depends on: Settings (`ShippingCountryService` allow-list + `shipping_countries` FK), Auth.
- Depended on by: Order (shipping cost + address prefill/snapshot), Coupon free-shipping.
