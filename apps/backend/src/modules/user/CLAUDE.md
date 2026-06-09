# User Module

Identity record + profile. The thing Auth authenticates and Role authorizes. Email-only login, soft-delete + anonymize.

## Responsibilities
- Admin CRUD + role assignment + status changes.
- Self profile read/update (whitelisted fields).
- Credential storage (argon2 hash, `select:false`).
- Soft delete with PII anonymization (preserves order history).
- Helpers for Auth: `findByEmailWithPassword`, `updatePassword`, `setEmailVerified`, `setLastLogin`.

## Key files
- `entities/user.entity.ts` — `email` is **citext** in DB (case-insensitive); `passwordHash` is `select:false` + `@Exclude`; `role` eager; `@DeleteDateColumn deletedAt`.
- `user.service.ts` — all logic. `create()` defaults status ACTIVE (admin) / pass PENDING for registration. `softDeleteAndAnonymize()` overwrites PII + soft-deletes in a txn.
- `controllers/user.controller.ts` — `/users` (`user.manage`).
- `controllers/me.controller.ts` — `/users/me` (`profile.manage.own`; whitelisted fields only — no role/status/email self-edit).
- `seeds/admin-user.seeder.ts` — initial admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env.
- `PasswordService` lives in `src/common/security/` (`SecurityModule`, `@Global`) — shared with Auth.

## Conventions / gotchas
- Email normalized to lowercase on store + lookup; uniqueness among non-deleted only (partial unique index) → deleted emails reusable.
- `findByEmailWithPassword` uses `addSelect('u.passwordHash')` — the only path that loads the hash.
- **Last-admin guard** (`assertNotLastAdminChange`): blocks deleting/suspending/demoting the last active admin.
- Self routes never accept `roleId`/`status` → no privilege escalation.
- `me.controller` userId comes from `@CurrentUser` (set by Auth's JwtAuthGuard — active once Auth module lands).
- `users.roleId` is `ON DELETE RESTRICT`; `avatarMediaId` is `ON DELETE SET NULL`.

## Dependencies
- Depends on: Role (FK + default role), Media (avatar validation), SecurityModule (PasswordService).
- Depended on by: Auth, and every user-scoped module (Order, Cart, Wishlist, Contacts, Location).
