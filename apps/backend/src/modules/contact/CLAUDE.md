# Contact Module

Storefront "Contact us" support messages. Anyone (guest or authenticated customer) submits; admins triage by status.

## Key files

- `entities/contact-message.entity.ts` — `contact_messages`; `userId` (nullable — sender if authed); `firstName`/`lastName`/`email` required, `phone` nullable; `topic` enum; `message` varchar(4000); `status` PENDING/PROCESSING/RESOLVED default PENDING.
- `enums/contact.enums.ts` — `ContactTopic` (ORDER, SHIPPING, RETURN, PRODUCT, PAYMENT, ACCOUNT, FEEDBACK, OTHER) + `ContactStatus`.
- `contact.service.ts` — `create` (trims/normalizes email, forces PENDING), admin `adminList` (filter status/topic), `findOne`, `setStatus`.
- `contact.controller.ts` — `POST /contact-messages` (`@OptionalAuth()` — guest-capable); userId from token if present, else null.
- `admin-contact.controller.ts` — `/admin/contact-messages` (`contact.manage`): `GET` list, `GET /:id`, `PATCH /:id/status`.

## Conventions / gotchas

- Status is admin-only: customers can't set or change it; `create` always forces PENDING. Only `PATCH /:id/status` (contact.manage) advances it.
- Email/phone are validated by class-validator (`@IsEmail`, phone `@Matches` regex 7–20 chars). Phone optional; everything else required (`message` min 10 chars).
- `userId` is nullable: set from the JWT when a logged-in customer submits, null for guests. The create route uses `@OptionalAuth()` (no permission required) so the public storefront form works for everyone.
- Only `contact.manage` (admin) lives in `permissions.ts`; re-run `pnpm seed` after changing so roles pick it up. (There is no customer-side contact permission — submitting is open.)

## Dependencies

- Depends on: Auth (current user + permission guard). `userId` is a nullable FK to `users` (`ON DELETE SET NULL`, migration `…030`) — null for guests; a deleted user nulls it but keeps the message.
- Depended on by: storefront `/contact` page (public), admin `/admin/contact-messages`.
