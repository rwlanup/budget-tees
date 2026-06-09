# Auth Module

Authentication + token lifecycle + **the global guards**. Importing this module activates auth/authorization app-wide.

## Responsibilities
- register / login / logout / logout-all.
- Short-lived access JWT + rotating refresh token (hashed in DB) with reuse detection.
- Email verification + password reset (hashed, single-use, expiring tokens).
- Change password; session list/revoke.
- Provide `JwtAuthGuard`, `PermissionsGuard` (both global via `APP_GUARD`) + per-request permission cache.

## Key files
- `services/token.service.ts` — access JWT signing; refresh **issue/rotate/revoke** (rotation revokes whole `familyId` on reuse); verification token issue/consume; `purgeExpired`.
- `services/permission-cache.service.ts` — caches `roleId -> permission keys` (60s TTL). Call `invalidate(roleId)` when a role's permissions change.
- `strategies/jwt.strategy.ts` — validates token, loads user, **enforces status=ACTIVE**, attaches `AuthUser` (incl. permissions) to `req.user`.
- `guards/jwt-auth.guard.ts` — global; skips `@Public()` routes.
- `guards/permissions.guard.ts` — global; enforces `@Permissions()`.
- `auth.service.ts` — flows; emits `email.send` events (Email module listens; logged in dev).

## Conventions / gotchas
- **Guards are global** (registered here as `APP_GUARD`: Throttler → Jwt → Permissions). Every route requires a valid JWT unless `@Public()`. Routes with `@Permissions(...)` additionally need those permission keys.
- Access token carries only `{ sub, roleId, type:'access' }` — permissions resolved per request (fresh within 60s cache window).
- Refresh tokens stored as **sha256 hash**; raw returned to client once. Reuse of a rotated token revokes the family.
- Login error is generic ("Invalid credentials"); `forgot-password`/`resend` always 200 → no email enumeration.
- Password reset / change revokes all sessions.
- Verification/reset emails: `AuthService.emitEmail` → EventEmitter (`email.send`). Until Email module (m22) consumes it, dev logs the token.
- Status re-checked every request in `JwtStrategy.validate` (suspended user blocked within cache window).

## Endpoints
- Public: register, login, refresh, verify-email, resend-verification, forgot-password, reset-password.
- Authenticated: logout, logout-all, me, change-password, sessions (list/revoke).

## Dependencies
- Depends on: User, Role, SecurityModule (PasswordService), JWT, EventEmitter.
- Depended on by: every protected route (guards + `@CurrentUser`).
