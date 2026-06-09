# Email Module

Transactional email: typed templates, **queued** delivery (BullMQ/Redis) with retries, and a send log. Other modules never call it directly — they emit `email.send` events.

## Key files
- `email.service.ts` — `enqueue()`: creates a QUEUED `email_logs` row + adds a BullMQ job (3 attempts, exponential backoff). `EMAIL_QUEUE = 'email'`.
- `email.processor.ts` — BullMQ `WorkerHost`: render → SMTP send → SENT; on failure FAILED, then DEAD after max attempts (rethrows so BullMQ retries).
- `mailer/mailer.service.ts` — nodemailer SMTP transport (config `smtp.*`).
- `mailer/template.renderer.ts` — subject + HTML/text per `EmailTemplate` (swap for MJML/Handlebars later, same interface).
- `listeners/email-event.listener.ts` — `@OnEvent('email.send')` → `enqueue`. **This is how Auth/Order/Payment/Returns trigger mail** (loose coupling via EventEmitter).

## Conventions / gotchas
- Producers emit `eventEmitter.emit('email.send', { template, to, data, refType?, refId?, userId? })`. Auth already does this for verification/reset; wire Order/Payment/Returns similarly.
- **Redis required** (BullMQ) — `redis.*` config; compose already runs Redis.
- No public send endpoint (internal/event only) → no open relay. SMTP creds env-only.
- `email_logs` stores render `data` + metadata, **not** the rendered body; tokens live only in transient job data + the email itself.
- Dev SMTP: point `SMTP_HOST/PORT` at MailHog (e.g. localhost:1025).
- Worker runs in-process; for scale run a dedicated worker process on the same queue.

## Dependencies
- Depends on: Redis/BullMQ, SMTP, EventEmitter, Settings (sender — currently from config).
- Depended on by: Auth, Order, Payment, Returns (via events).
