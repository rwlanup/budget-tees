# Budget Tees — Frontend Design System & Architecture

> Single source of truth for the storefront + admin. Read this **before** building any
> module. Every page, component, and API call follows the rules here. Backend contracts
> live in `apps/backend/src/modules/<module>/CLAUDE.md` — align to those, never invent
> mismatched shapes.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui · lucide-react ·
react-hook-form · zod · TanStack Query v5 · native `fetch` · Zustand (sparingly).

---

## 1. Design Principles

1. **Simplicity** — one primary action per screen; progressive disclosure over walls of options.
2. **Consistency** — same tokens, same components, same spacing everywhere. No per-page hex, no one-off paddings.
3. **Scalability** — feature-sliced folders, reusable primitives, typed contracts. Adding a module never edits another module.
4. **Mobile-first** — design at 375px, scale up. Touch targets ≥ 44px.
5. **Accessible by default** — semantic HTML, labels, focus rings, 4.5:1 contrast, `prefers-reduced-motion`.
6. **Server-trusted** — prices, totals, tax, stock, and auth state are computed by the backend. The UI displays and requests; it never recomputes money.

---

## 2. Color System

shadcn/ui on Tailwind v4 uses CSS variables in **oklch**, split into light/dark blocks and
exposed to Tailwind via `@theme inline`. Brand identity: **neutral zinc canvas, near-black
primary action (timeless apparel look), emerald reserved for savings/sale (on-brand for
"Budget"), amber for ratings, red for destructive.**

### Tokens (drop into `globals.css`)

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;

  --background: oklch(1 0 0); /* white */
  --foreground: oklch(0.21 0.006 285.9); /* zinc-900 ink */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.21 0.006 285.9);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.21 0.006 285.9);

  --primary: oklch(0.21 0.006 285.9); /* near-black CTA */
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.967 0.001 286.4); /* zinc-100 */
  --secondary-foreground: oklch(0.21 0.006 285.9);
  --muted: oklch(0.967 0.001 286.4);
  --muted-foreground: oklch(0.552 0.016 285.9); /* zinc-500, ≥4.5:1 on white */
  --accent: oklch(0.967 0.001 286.4);
  --accent-foreground: oklch(0.21 0.006 285.9);

  --success: oklch(0.627 0.17 149.2); /* emerald-600 — savings/in-stock */
  --success-foreground: oklch(0.985 0 0);
  --warning: oklch(0.769 0.16 70.08); /* amber — ratings/low stock */
  --destructive: oklch(0.577 0.245 27.33); /* red-600 */
  --destructive-foreground: oklch(0.985 0 0);

  --border: oklch(0.92 0.004 286.3); /* zinc-200 */
  --input: oklch(0.92 0.004 286.3);
  --ring: oklch(0.21 0.006 285.9);
}

.dark {
  --background: oklch(0.141 0.005 285.8); /* zinc-950 */
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.21 0.006 285.9);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.21 0.006 285.9);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0); /* invert: light CTA on dark */
  --primary-foreground: oklch(0.21 0.006 285.9);
  --secondary: oklch(0.274 0.006 286);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.274 0.006 286);
  --muted-foreground: oklch(0.705 0.015 286); /* lighter, retest contrast */
  --accent: oklch(0.274 0.006 286);
  --accent-foreground: oklch(0.985 0 0);
  --success: oklch(0.696 0.17 149.2);
  --success-foreground: oklch(0.141 0.005 285.8);
  --warning: oklch(0.828 0.16 75);
  --destructive: oklch(0.704 0.19 22.2);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(1 0 0 / 12%);
  --input: oklch(1 0 0 / 16%);
  --ring: oklch(0.552 0.016 285.9);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --font-sans: var(--font-nunito), system-ui, sans-serif;
  --font-heading: var(--font-rubik), var(--font-nunito), sans-serif;
}
```

### Usage rules

- **Always use semantic token classes**: `bg-primary`, `text-muted-foreground`, `border-border`. Never raw `bg-zinc-900` or hex in a component.
- Functional color is **never the only signal** — pair savings green / stock red with an icon or text (`color-not-only`).
- Dark mode is a tonal remap (above), not an inversion. Test contrast in both themes independently.
- Dark mode toggled via `.dark` class on `<html>` (next-themes, `class` strategy).

---

## 3. Typography

Loaded with `next/font/google` (self-hosted, `display: swap`, no layout shift) in
`app/layout.tsx`, exposing `--font-rubik` / `--font-nunito`.

```ts
import { Rubik, Nunito_Sans } from 'next/font/google';
const rubik = Rubik({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rubik',
});
const nunito = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
});
// <html className={`${rubik.variable} ${nunito.variable}`}>
```

- **Headings:** Rubik (`font-heading`), weight 600–700.
- **Body / UI:** Nunito Sans (`font-sans`), weight 400; labels 500.

### Type scale (Tailwind classes)

| Token   | Class                                         | Size / LH  | Use                              |
| ------- | --------------------------------------------- | ---------- | -------------------------------- |
| Display | `text-4xl md:text-5xl font-heading font-bold` | 36/48px    | Hero                             |
| H1      | `text-3xl font-heading font-bold`             | 30px       | Page title                       |
| H2      | `text-2xl font-heading font-semibold`         | 24px       | Section                          |
| H3      | `text-xl font-heading font-semibold`          | 20px       | Card title                       |
| Body-lg | `text-lg`                                     | 18px       | Lead                             |
| Body    | `text-base`                                   | 16px / 1.6 | Default (min 16px → no iOS zoom) |
| Small   | `text-sm`                                     | 14px       | Meta, helper                     |
| Caption | `text-xs`                                     | 12px       | Badges, timestamps (never body)  |

- Body line-height 1.5–1.6; measure 60–75 chars (`max-w-prose` for long text).
- Prices, quantities, order totals → `tabular-nums` to prevent column shift.
- Headings sequential h1→h6, no skips.

---

## 4. Spacing System

- **4 / 8px rhythm** — use Tailwind scale only (`p-2`=8, `p-4`=16, `p-6`=24, `gap-8`=32, `py-12`=48). No arbitrary `p-[13px]`.
- **Vertical rhythm tiers:** intra-component 8/12/16 · section 24/32 · page-section 48/64.
- **Page container:** `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8` (storefront). Admin content `max-w-screen-2xl`.
- **Reading width:** `max-w-prose` for descriptions/policy text.
- **Grid:** product grid `grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4`. Forms single-column on mobile, `sm:grid-cols-2` for paired fields (e.g. city/postal).
- **z-index scale:** base 0 · sticky header 30 · dropdown 40 · overlay/sheet 50 · toast 60. (shadcn portals already layer correctly; only override within these tiers.)

---

## 5. Component System (shadcn/ui)

**Use shadcn primitives wherever one exists. Do not hand-roll buttons, dialogs, selects.**
Install on demand: `pnpm dlx shadcn@latest add button input ...`. Base color **zinc**.
Generated into `src/components/ui/` (treated as vendored — edit only to extend variants).

### Baseline install set

`button input textarea label select checkbox radio-group switch form dialog sheet drawer dropdown-menu popover tooltip tabs card badge table skeleton sonner(toast) avatar separator accordion alert alert-dialog pagination breadcrumb command navigation-menu scroll-area aspect-ratio`.

### Component contracts

| Component                           | Source                      | Rules / variants                                                                                                                                                                                                                                  |
| ----------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Button**                          | shadcn                      | Variants `default`(primary CTA), `secondary`, `outline`, `ghost`, `destructive`, `link`. Sizes `sm/default/lg/icon`. **One `default` CTA per view.** Async → `disabled` + `<Loader2 className="animate-spin" />`. Icon buttons need `aria-label`. |
| **Input / Textarea**                | shadcn                      | Always wrapped in `<Form>` field. Correct `type`/`inputMode` (email/tel/numeric). h ≥ 44px on mobile.                                                                                                                                             |
| **Select**                          | shadcn                      | Native-feeling; for large/searchable sets use `Command` combobox.                                                                                                                                                                                 |
| **Modal**                           | shadcn `Dialog`             | Desktop dialogs; **mobile → `Drawer`/`Sheet`** (bottom sheet). Always a close affordance + Esc. Confirm before dismiss with unsaved changes.                                                                                                      |
| **Table**                           | shadcn `Table`              | Admin lists. Server-paginated. Sortable headers carry `aria-sort`. **Collapses to card list < `md`.**                                                                                                                                             |
| **Card**                            | shadcn                      | `rounded-lg border bg-card`. Consistent elevation: rest `border` only, hover `shadow-sm`. No random shadows.                                                                                                                                      |
| **Badge**                           | shadcn                      | Status semantics: order/return/payment states map to a fixed variant table (§ module docs). Always icon+text, never color-only.                                                                                                                   |
| **Tabs**                            | shadcn                      | In-page section switching (e.g. product Description/Reviews/Shipping).                                                                                                                                                                            |
| **Dropdown**                        | shadcn `DropdownMenu`       | Row actions, account menu. Overflow actions → "more" menu, never cram.                                                                                                                                                                            |
| **Toast**                           | shadcn `Sonner`             | Mounted once in root layout. Success/error feedback. Auto-dismiss 3–5s, `aria-live`, never steals focus.                                                                                                                                          |
| **Skeleton**                        | shadcn                      | Loading > 300ms. Match final layout dimensions to avoid CLS.                                                                                                                                                                                      |
| **Pagination / Breadcrumb / Empty** | shadcn + local `EmptyState` | List nav, deep-hierarchy orientation, empty results.                                                                                                                                                                                              |

### Shared app components (built on primitives, `src/components/shared/`)

`PriceTag` (currency + tabular, strike-through compare-at), `RatingStars`, `QuantityStepper`,
`EmptyState` (icon+title+description+CTA), `DataState` (wraps query: loading/error/empty/data),
`ConfirmDialog`, `Pagination` (wired to query params), `ProductImage` (next/image + aspect-ratio + blur),
`PageHeader`, `FormError`, `SubmitButton` (pending-aware).

---

## 6. Form Standards

**react-hook-form + zod** via shadcn `<Form>` (`zodResolver`). Schemas live in
`src/modules/<m>/schemas/` and **mirror backend DTO validation exactly** (read the module's CLAUDE.md).

```tsx
const form = useForm<z.infer<typeof loginSchema>>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: '', password: '' },
  mode: 'onTouched', // validate on blur, not keystroke
});
```

Rules:

- **Visible `<FormLabel>` per field** (never placeholder-as-label). Required fields marked `*`.
- **Validate on blur** (`onTouched`); errors render `<FormMessage>` directly **below the field**.
- Helper text via `<FormDescription>` (persistent, not placeholder).
- Password fields: show/hide toggle; `autoComplete` set (`current-password`/`new-password`).
- Submit: `SubmitButton` disables + spinner while `isPending`. On success → toast + navigate/reset. On API error → map field errors (§9) and **focus first invalid field**; show form-level `<Alert variant="destructive">` for non-field errors.
- Long/multi-step forms (checkout, product create): step indicator, back-nav allowed, never lose entered data on step change.
- Destructive submits (delete) → `AlertDialog` confirm, red emphasis, spatially separated from primary.
- Client zod is **UX only**; the server re-validates and is authoritative.

---

## 7. Icon Usage

- **lucide-react only.** No emoji as icons, ever.
- Sizes are tokens: inline-with-text `size-4` (16), default UI `size-5` (20), feature/empty-state `size-6`+ (24). Don't mix arbitrary sizes in one layer.
- Default stroke (2px) everywhere; don't mix stroke widths.
- Decorative icon → `aria-hidden`. Icon-only button → `aria-label`.
- Canonical map: cart `ShoppingCart`, wishlist `Heart`, account `User`, search `Search`, success `CheckCircle2`, error `AlertCircle`, warning `TriangleAlert`, loading `Loader2 animate-spin`, remove `Trash2`, edit `Pencil`, more `MoreHorizontal`, sort `ArrowUpDown`. Reuse these — no synonyms.

---

## 8. Layout Patterns

Two top-level shells via App Router **route groups**:

- **`(shop)`** — storefront. Sticky `Header` (logo, category nav via `NavigationMenu`, search, cart sheet trigger w/ count badge, account menu) + `Footer`. Mobile: hamburger `Sheet` nav + bottom-relevant actions. Cart opens as a `Sheet`.
- **`(admin)`** — `/admin/*`. Collapsible left `Sidebar` (≥`lg`, drawer on mobile) + top bar (breadcrumb, user menu). Adaptive: sidebar on desktop, drawer below.
- **`(auth)`** — centered single-column card (`max-w-md`), logo, minimal chrome, no nav. Brand panel optional on `lg`.

Pattern specifics:

- **Product listing:** filter sidebar (`lg`) / filter `Sheet` (mobile) + responsive product grid + server pagination. Filters & sort live in **URL search params** (shareable, back-restores state).
- **Product detail:** gallery (`AspectRatio` + thumbnails) | info column (title, `PriceTag`, variant selectors, `QuantityStepper`, add-to-cart, wishlist) → `Tabs` (details/shipping/returns) → related grid.
- **Checkout:** multi-step (Address → Shipping/Pickup → Review → Pay) with step indicator; order summary sticky aside on desktop, collapsible on mobile.
- Fixed header reserves body offset; safe-area-aware; lists never hidden behind sticky bars.

---

## 9. API Integration Pattern

Backend: NestJS, **global prefix `/api`**, CORS enabled, JWT access + rotating refresh.

### 9.1 Response & error envelope (authoritative — from backend `AllExceptionsFilter`)

- **Success:** controllers return the resource/DTO directly (no wrapper). Lists return
  `{ items, total, page, limit, totalPages }` (the `PaginatedResult<T>` shape).
- **Error (any non-2xx):**
  ```json
  {
    "statusCode": 400,
    "code": "BAD_REQUEST",
    "message": "string | string[]",
    "details": {},
    "path": "/api/..."
  }
  ```
  `message` may be a **string or string[]** (class-validator). `code` is a stable string
  (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `UNPROCESSABLE_ENTITY`, `TOO_MANY_REQUESTS`, …).

### 9.2 fetch client (`src/lib/api/client.ts`)

A thin typed wrapper around `fetch`:

- Base URL from `process.env.NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000/api`).
- Attaches `Authorization: Bearer <access>` (token from auth store, in memory).
- Parses JSON; on non-2xx **throws `ApiError`** (`{ statusCode, code, message, fieldErrors? }`), normalizing `message: string[]` → joined string + best-effort field map.
- **401 → single-flight refresh**: call `/auth/refresh`, retry once; on refresh failure clear session + redirect to login. Never loop.
- `Idempotency-Key` header passed through for order checkout.

### 9.3 TanStack Query

- One `QueryClientProvider` in root. Defaults: `staleTime` 30s, `retry` 1 (no retry on 4xx), `refetchOnWindowFocus` false.
- **Query-key factory per module** (`src/modules/<m>/queries.ts`), never inline string keys:
  ```ts
  export const productKeys = {
    all: ['products'] as const,
    list: (params: ProductListParams) => [...productKeys.all, 'list', params] as const,
    detail: (slug: string) => [...productKeys.all, 'detail', slug] as const,
  };
  ```
- Reads → `useQuery`; writes → `useMutation` with **targeted `invalidateQueries`** (e.g. add-to-cart invalidates `cartKeys.all`). Use optimistic updates for cart quantity / wishlist toggle with rollback `onError`.
- Server Components may prefetch + `dehydrate` for first paint (product listing/detail SEO); interactive trees use client hooks.

### 9.4 Loading / error / empty (the `DataState` contract)

Every data view handles four states explicitly:

- **Loading** → `Skeleton` matching layout (not a bare spinner) when > 300ms.
- **Error** → inline `Alert` + **Retry** button (`refetch`); 401 handled globally.
- **Empty** → `EmptyState` (icon + message + CTA), never a blank screen.
- **Data** → content.

Mutations: button pending state → toast success / error. 409/422 map to field or form errors with a recovery path (`error-clarity`, `error-recovery`).

---

## 10. State Management Strategy

Pick the **lowest-power tool** that works:

1. **URL search params** — listing filters, sort, page, search query, active tab. Shareable, SSR-able, back-restores.
2. **TanStack Query** — _all_ server data (products, cart, orders, profile…). This is the cache; don't mirror it into Zustand.
3. **Local `useState`/`useReducer`** — ephemeral UI: open/closed, hovered, form field focus.
4. **React Context** — cross-cutting, low-churn: theme, current-user snapshot.
5. **Zustand** — only genuinely-global client state with no server home: **auth tokens/session** (`useAuthStore`), **cart drawer open state**, optional guest-cart buffer. Keep stores tiny; never duplicate query data.

Rule: if the server owns it, it lives in Query — not Zustand.

---

## 11. Folder Structure

Feature-sliced. A module owns its components/hooks/schemas/queries/types; `components/` and
`lib/` hold only cross-module shared code.

```
apps/frontend/src/
├── app/                          # App Router (routing + layouts only, thin)
│   ├── (shop)/                   # storefront shell
│   │   ├── layout.tsx
│   │   ├── page.tsx              # home
│   │   ├── products/ ...         # listing + [slug] detail
│   │   ├── cart/  checkout/  orders/  wishlist/  account/
│   ├── (auth)/                   # login / register / forgot / reset
│   ├── (admin)/admin/ ...        # dashboard, products, orders, media, settings
│   ├── layout.tsx                # root: fonts, providers, <Toaster/>
│   └── globals.css               # tokens (§2)
├── components/
│   ├── ui/                       # shadcn primitives (vendored)
│   ├── shared/                   # PriceTag, DataState, EmptyState, Pagination…
│   └── layout/                   # Header, Footer, Sidebar, MobileNav
├── modules/                      # ← feature logic, one folder per backend module
│   └── <module>/
│       ├── components/           # module-specific UI
│       ├── hooks/                # useLogin, useProductList…
│       ├── queries.ts            # query-key factory + useQuery/useMutation
│       ├── schemas.ts            # zod (mirrors backend DTO)
│       ├── api.ts                # endpoint fns calling the fetch client
│       └── types.ts              # response/DTO types
├── lib/
│   ├── api/                      # client.ts, ApiError, refresh logic
│   ├── query/                    # queryClient, Providers
│   ├── utils.ts                  # cn(), formatCurrency, formatDate
│   └── auth/                     # auth store, guards/middleware helpers
├── hooks/                        # truly generic (useMediaQuery, useDebounce)
├── types/                        # global shared types (ApiError, Paginated<T>)
└── config/                       # site config, nav config, env
```

`services/` from the brief is folded into each module's `api.ts` + `lib/api/` (co-located with
the feature rather than a flat global services dir). `features/` and `modules/` are unified
under `modules/` to avoid ambiguity.

---

## 12. Naming Conventions

| Thing                     | Convention                           | Example                                   |
| ------------------------- | ------------------------------------ | ----------------------------------------- |
| Component file            | `PascalCase.tsx`                     | `ProductCard.tsx`, `AddToCartButton.tsx`  |
| Component                 | `PascalCase`                         | `ProductCard`                             |
| Hook file & fn            | `useX.ts` / `useX`                   | `useProductList.ts` → `useProductList`    |
| Non-component module file | `kebab-case.ts`                      | `queries.ts`, `api.ts`, `order-status.ts` |
| zod schema                | `xSchema` + inferred `X` type        | `loginSchema` → `type LoginInput`         |
| Query-key factory         | `<entity>Keys`                       | `productKeys`, `cartKeys`                 |
| Route folder              | `kebab-case` / `(group)` / `[param]` | `(shop)`, `products/[slug]`               |
| Type / interface          | `PascalCase`, no `I` prefix          | `Product`, `PaginatedResult<T>`           |
| Boolean prop              | `is/has/can`                         | `isLoading`, `hasError`                   |
| Event handler             | `handleX` (local), `onX` (prop)      | `handleSubmit`, `onSelect`                |
| Constant                  | `SCREAMING_SNAKE`                    | `PAGE_SIZE`, `QUERY_STALE_TIME`           |

---

## Backend alignment checklist (per module, before coding)

1. Open `apps/backend/src/modules/<module>/CLAUDE.md` — read endpoints, auth (`@Public` vs `@Permissions`), DTOs.
2. Mirror DTO validation in `schemas.ts` (field names, optionality, min/max).
3. Type responses in `types.ts` from the actual entity/DTO; lists are `PaginatedResult<T>`.
4. Errors are the `{ statusCode, code, message, details, path }` envelope — handle via `ApiError`.
5. Money/tax/totals come from the server; render, don't compute.
6. Public routes need no token; permissioned admin routes gate UI **and** rely on server enforcement.

## Pre-delivery checklist (every module)

- [ ] shadcn primitives used; no hand-rolled equivalents
- [ ] Loading (skeleton) / error (retry) / empty (EmptyState) all handled
- [ ] Mobile 375px verified; touch targets ≥44px; no horizontal scroll
- [ ] Labels + `<FormMessage>` below field; first invalid field focused on error
- [ ] Semantic tokens only (no raw hex / zinc-x in components)
- [ ] Light + dark contrast ≥4.5:1; focus rings visible; `prefers-reduced-motion` respected
- [ ] lucide icons, canonical map, no emoji; icon-only buttons labeled
- [ ] Query keys via factory; mutations invalidate correctly
- [ ] Schema mirrors backend DTO; no invented fields

```

```
