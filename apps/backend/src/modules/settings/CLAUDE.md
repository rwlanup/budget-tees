# Settings Module

Central store configuration. Two parts: a **typed key-value registry** and a **shipping countries** table. `@Global` — `SettingsService` / `ShippingCountryService` inject anywhere without re-importing.

## Responsibilities
- Typed get/set of named settings (jsonb values), with defaults from a code-defined schema.
- Manage allowed shipping countries (the destinations checkout accepts).
- Provide `isAllowed(countryCode)` for Order checkout and shipping config to Location/Tax.

## Key files
- `constants/settings-schema.ts` — **single source of truth** for valid setting keys, types, defaults, groups, `isPublic`. Add a new setting here first; unknown keys are rejected at write time.
- `entities/setting.entity.ts` — `settings` table, PK = `key` (natural key, no uuid).
- `entities/shipping-country.entity.ts` — `shipping_countries`, PK = ISO alpha-2 `code` (uppercase).
- `services/settings.service.ts` — typed accessors + in-process cache. Convenience getters: `getReservationTtlMinutes`, `getCodCap`, `isShippingTaxable`, `getReturnWindowDays`.
- `services/shipping-country.service.ts` — CRUD + `isAllowed(code)`.
- `seeds/settings.seeder.ts` — seeds default settings (missing keys only) + Nepal (`NP`).

## Conventions / gotchas
- **Secrets never live here** (JWT/SMTP/gateway keys are env-only). Registry holds non-secret config; `isPublic=true` exposes a key to the storefront via `GET /api/settings/public`.
- Values are validated against the schema `type` on write (`validateType`).
- Cache is in-process (`Map`), invalidated on write. Swap for Redis if multi-instance.
- Country codes normalized to uppercase everywhere.

## Endpoints
- Public: `GET /settings/public`, `GET /shipping-countries` (active).
- Admin (`settings.manage`): `GET/PUT /admin/settings[/:key]`, `GET/POST/PATCH/DELETE /admin/shipping-countries`.

## Dependencies
- Depends on: none (foundational).
- Depended on by: Order (allowed country, TTLs, COD cap), Location, Tax, Email (sender), storefront.
