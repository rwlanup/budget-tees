# Tax Module

Tax classes × country rates. Prices are **tax-inclusive** → tax is *extracted* from the price (breakdown/reporting), never added on top.

## Key files
- `entities/tax-class.entity.ts` — `tax_classes` (one `isDefault`, partial unique index).
- `entities/tax-rate.entity.ts` — `tax_rates`, unique `(taxClassId, countryCode)`, `rate` numeric→number.
- `services/tax.service.ts` — class + rate CRUD.
- `services/tax-calculator.service.ts` — `resolveRate(classId|null, country)` (falls back to default class; missing rate → 0 + warn) and **`extractLineTax(inclusiveAmount, classId, country)`** → `{net, tax, rate, label}` (uses `extractInclusiveTax` money util).
- `seeds/tax.seeder.ts` — Standard class (default) + 13% VAT for `NP`.

## Conventions / gotchas
- **Inclusive pricing:** Order's `taxTotal` is the sum of extracted `tax` per line; `grandTotal` does NOT add tax (it's embedded in subtotal). See Order CLAUDE.
- Missing rate for (class, country) → 0% + logged warning (never silently mis-guess).
- This migration adds the deferred **`products.taxClassId → tax_classes` FK** (SET NULL); unassigned products fall back to the default class at calculation time.
- `tax_rates.countryCode` FK → `shipping_countries` (RESTRICT).
- Round-half-up via the shared money util; extract per line then sum (avoid drift).
- Region removed per design change — country-level rates only.

## Dependencies
- Depends on: Settings (`shipping_countries` for FK), Product (taxClassId), Auth.
- Depended on by: Order (line tax extraction), invoicing/Email.
