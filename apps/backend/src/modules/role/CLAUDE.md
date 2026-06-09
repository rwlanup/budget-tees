# Role Module (RBAC)

Authority layer. Roles hold a set of permissions; guards check **permissions**, not role names. Single role per user (FK `users.roleId`).

## Responsibilities
- CRUD roles + bind permissions (many-to-many `role_permissions`).
- Serve a role's effective permission keys to the auth guard.
- Seed the permission catalog + system roles (admin, customer).

## Key files
- `entities/permission.entity.ts` — `permissions` (uuid, unique `key`, `group`).
- `entities/role.entity.ts` — `roles`; `permissions` is **eager** M:N; `isSystem` protects admin/customer.
- `services/permission.service.ts` — `findByKeys()` validates keys exist (422 on unknown).
- `services/role.service.ts` — CRUD; `getPermissionKeys(roleId)` consumed by `PermissionsGuard` (Auth module).
- `seeds/role.seeder.ts` — upserts `PERMISSION_CATALOG` + admin (all) / customer (`CUSTOMER_PERMISSIONS`).

## Conventions / gotchas
- Permission vocabulary lives in `src/common/constants/permissions.ts` (`PERMISSIONS`, `PERMISSION_CATALOG`, `CUSTOMER_PERMISSIONS`). Add new permissions there — they seed into the table and are referenced by `@Permissions()`.
- System roles: cannot be deleted (403) or renamed. Permissions on them CAN change.
- Role delete is blocked by FK RESTRICT on `users.roleId` → caught as 409 ("assigned to users").
- `permissions` relation is eager — `getPermissionKeys` and `findOne` return permissions without explicit joins.

## Endpoints (all `role.manage`)
- `/roles` CRUD, `PUT /roles/:id/permissions` (replace set), `GET /permissions` (catalog).

## Dependencies
- Depends on: none (foundational).
- Depended on by: User (FK + default role), Auth (permission resolution for guards), every `@Permissions()`-gated route.
