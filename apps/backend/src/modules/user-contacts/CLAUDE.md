# User Contacts Module

Additional contact channels per user — multiple emails + phones — beyond the primary auth email. No verification (informational/notifications/shipping).

## Key files
- `entities/user-email.entity.ts` — `user_emails`, `email` citext, unique `(userId, email)`.
- `entities/user-phone.entity.ts` — `user_phones`, `e164` (normalized), unique `(userId, e164)`.
- `services/user-emails.service.ts` / `user-phones.service.ts` — CRUD + primary-toggle.
- Controllers: `me*` (`profile.manage.own`, scoped to `@CurrentUser`) + `AdminUser*` (`user.manage`, by `:userId`).

## Conventions / gotchas
- **One primary per type per user** — enforced by partial unique index `WHERE isPrimary` + service (`clearPrimary` before set). First contact added auto-becomes primary; deleting the primary promotes the oldest remaining.
- Phones normalized to **E.164** via `libphonenumber-js` (`countryCode` as default region); invalid → 422.
- Emails lowercased; dup per user → 409.
- All self queries scoped by `userId` from token → no IDOR.
- Cascade-deleted with the user (pure PII).

## Dependencies
- Depends on: User (FK), Auth (guards/current user).
- Depended on by: Order/Location (contact selection), Email (notification targets).
