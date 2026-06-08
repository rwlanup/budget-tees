# Budget Tees

pnpm monorepo with two apps.

| App | Path | Stack |
| --- | --- | --- |
| frontend | `apps/frontend` | Next.js 15, React 19, Tailwind CSS v4 |
| backend | `apps/backend` | NestJS 11, TypeORM, PostgreSQL (`pg`) |

Shared dev tooling (TypeScript, ESLint, Prettier) lives in the root `package.json`.
TypeScript is pinned once in the pnpm **catalog** (`pnpm-workspace.yaml`) and both apps
reference it via `"typescript": "catalog:"`, so they always use the same version.

## Setup

```bash
pnpm install
```

The pnpm store is kept inside the project (`.pnpm-store/`, see `.npmrc`).

Backend needs a Postgres database — copy the env template and fill it in:

```bash
cp apps/backend/.env.example apps/backend/.env
```

## Common commands (run from repo root)

```bash
pnpm dev            # run both apps in parallel
pnpm dev:frontend   # Next.js dev server  (http://localhost:3000)
pnpm dev:backend    # NestJS watch mode    (http://localhost:4000)
pnpm build          # build every app
pnpm lint           # lint every app
pnpm format         # format with Prettier
```

## Backend migrations

```bash
pnpm --filter backend migration:generate src/migrations/<Name>
pnpm --filter backend migration:run
pnpm --filter backend migration:revert
```
