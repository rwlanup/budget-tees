# Budget Tees — Frontend Design System & Architecture

> Single source of truth for the **storefront + admin**. Read this **before** building or
> editing any UI. Every page, component, and API call follows the rules here. Backend
> contracts live in `apps/backend/src/modules/<module>/CLAUDE.md` — align to those, never
> invent mismatched shapes. **Redesigns never touch API endpoints, request/response shapes,
> business logic, auth, state logic, or data flow** — only layout, structure, styling, motion.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · shadcn/ui · Radix · lucide-react ·
`motion` (Framer Motion) · embla-carousel · vaul · cmdk · lenis · react-hook-form · zod ·
TanStack Query v5 · native `fetch` · Zustand (sparingly).

---

## 1. Design Philosophy

**"Premium streetwear, not a web store."** Budget Tees should feel like a modern fashion label
— confident, fast, and tactile — across both the storefront _and_ the admin. We reject the
usual split of a pretty shopfront bolted to a generic dashboard: admin and storefront share
one design language, one token set, one motion vocabulary.

The visual identity: a **clean neutral canvas** (near-white / deep zinc) carrying the product
imagery, punctuated by a single **logo brand accent** for energy, focus, and
moments of delight. CTAs are confident black/white (timeless apparel look — Nike, StockX,
Apple); logo brand is the spark (Linear, Stripe, Arc). Big editorial type, generous whitespace,
soft layered surfaces, and motion that feels intentional — never decorative noise.

### Design Principles

1. **Mobile-first** — design at 375px, scale up. Touch targets ≥ 44px. Bottom sheets over modals on mobile.
2. **Gen Z / fashion-forward** — bold display type, big imagery, social-commerce energy, playful microinteractions.
3. **Premium ecommerce** — whitespace, soft elevation, restraint. One hero moment per screen; no clutter.
4. **One ecosystem** — admin and storefront share tokens, primitives, and motion. Admin is product, not spreadsheet.
5. **Performance-first** — lazy-load below the fold, GPU-friendly transforms only, zero layout shift, optimize images.
6. **Accessibility-first** — semantic HTML, labels, visible focus, 4.5:1 contrast, full keyboard nav, `prefers-reduced-motion`.
7. **Server-trusted** — prices, totals, tax, stock, auth are computed by the backend. The UI displays and requests; it never recomputes money.

---

## 2. Color System

Tailwind v4 CSS variables in **oklch**, split into light/dark blocks and exposed via
`@theme inline` in `app/globals.css`. **Never put raw hex or `zinc-x` in a component — use
semantic token classes only.**

### Token roles

| Token                                    | Role                                                                                |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `background` / `foreground`              | App canvas + ink. Slightly cool neutral.                                            |
| `card` / `popover` / `elevated`          | Layered surfaces. `elevated` = raised neutral panel.                                |
| `primary`                                | **Confident CTA** — near-black (light) / near-white (dark). The main action.        |
| `brand` / `brand-strong` / `brand-muted` | **From Logo** — links, focus ring, active states, highlights, gradients, energy.    |
| `secondary` / `muted` / `accent`         | Neutral fills + **shadcn hover background** (keep neutral — never vibrant).         |
| `success`                                | Savings / in-stock (emerald).                                                       |
| `warning`                                | Ratings / low stock (amber).                                                        |
| `destructive`                            | Errors / delete (red).                                                              |
| `border` / `input` / `ring`              | Hairlines, field borders, **vibrant brand logo color focus glow** (`ring` = brand). |
| `sidebar-*`                              | Admin sidebar surface set.                                                          |

### Usage rules

- **Semantic classes only**: `bg-primary`, `text-brand`, `border-border`, `bg-card`, `text-muted-foreground`. No `bg-zinc-900`, no hex.
- **`primary` = the action; `brand` = the accent.** Don't make every button logo color — reserve `brand` for emphasis (one accent moment per view). Use the `brand` button/badge variant intentionally.
- `accent`/`muted` stay neutral — they are shadcn's hover/disabled fills. Never repaint them with brand color.
- Functional color is **never the only signal** — pair savings/stock/status color with icon + text.
- **Dark mode is a tonal remap, not an inversion.** Deep zinc surfaces, brighter logo color glow, soft shadows. Test contrast independently in both themes (`.dark` on `<html>`, next-themes `class` strategy).
- Gradients: `text-gradient` (ink→logo color text), `bg-brand-gradient`, `bg-aurora` (soft logo color glow field for heroes/empty states).

---

## 3. Typography

`next/font/google`, self-hosted, `display: swap`. **Bricolage Grotesque** (display/headings,
editorial character) + **Inter** (body/UI, neutral + legible). Exposed as `--font-bricolage` /
`--font-inter`; `h1–h4` auto-apply the heading font with tight `-0.02em` tracking (set in base layer).

| Token   | Class                                                                     | Use                              |
| ------- | ------------------------------------------------------------------------- | -------------------------------- |
| Hero    | `text-4xl sm:text-6xl lg:text-7xl font-heading font-bold tracking-tight`  | Homepage / editorial hero        |
| Display | `text-3xl sm:text-4xl font-heading font-bold`                             | Big section headers              |
| H1      | `text-2xl sm:text-3xl font-heading font-bold`                             | Page title                       |
| H2      | `text-xl sm:text-2xl font-heading font-semibold`                          | Section                          |
| H3      | `text-lg font-heading font-semibold`                                      | Card / block title               |
| Body-lg | `text-lg leading-relaxed`                                                 | Lead paragraph                   |
| Body    | `text-base leading-[1.6]`                                                 | Default (min 16px → no iOS zoom) |
| Small   | `text-sm`                                                                 | Meta, helper                     |
| Caption | `text-xs`                                                                 | Badges, timestamps (never body)  |
| Eyebrow | `text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground` | Section kicker above a heading   |

- Headings are `font-heading`; body/UI is `font-sans` (default). Don't set heading font on body copy.
- Prices, quantities, order totals, table numbers → `tabular-nums`.
- Long text → `max-w-prose` (60–75 chars). Headings sequential h1→h6, no skips.
- Big editorial type is encouraged on storefront marketing surfaces; admin stays tighter (H1 = `text-2xl`).

---

## 4. Spacing & Shape

- **4 / 8px rhythm** via Tailwind scale only (`p-2/4/6`, `gap-8`, `py-12/16/24`). No arbitrary `p-[13px]`.
- **Vertical rhythm:** intra-component 8/12/16 · section 24/32 · **page-section 64/80/96** (storefront breathes — `py-16 sm:py-24`). Admin sections tighter (`py-6/8`).
- **Page container:** storefront `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`; admin content `max-w-screen-2xl`.
- **Radius scale** (base `--radius: 0.75rem`): `rounded-md` (inputs/sm), `rounded-lg` (buttons/controls), `rounded-xl` (cards), `rounded-2xl`/`rounded-3xl` (hero panels, feature blocks, sheets). Pick by elevation tier; be consistent.
- **Elevation** = soft, layered, faintly logo color-tinted shadow tokens (`shadow-xs → shadow-2xl`, plus `shadow-brand` glow). Rest state: `border` or `shadow-xs`. Hover: lift one step (`hover:shadow-md`). **No harsh/black box-shadows, no heavy borders everywhere** — prefer one hairline border _or_ one soft shadow, rarely both.
- **z-index:** base 0 · sticky header 30 · dropdown 40 · overlay/sheet 50 · toast 60.

---

## 5. Component System (shadcn/ui)

**Use shadcn primitives wherever one exists. Never hand-roll buttons, dialogs, selects, inputs.**
Base color zinc; generated into `src/components/ui/` (vendored — edit only to extend variants/tokens).
The primitives below are **already extended** with the new system — use the variants, don't fork.

### Component Standards

| Component                                | Rules / variants                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Button**                               | `rounded-lg`, `font-semibold`, springy `active:scale-[0.97]` press, hover elevation. Variants: `default` (near-black CTA), **`brand`** (logo color, emphasis CTA — one per view max), `secondary`, `outline`, `ghost`, `destructive`, `link`. Sizes `xs/sm/default(h-10)/lg(h-12)/icon*`. Async → `disabled` + `<Loader2 className="animate-spin" />`. Icon-only needs `aria-label`. **One primary CTA per view.** |
| **Input / Textarea / Select**            | `h-10` (≥44px touch), `rounded-lg`, logo color focus ring + selection. Always inside `<Form>` field. Correct `type`/`inputMode`. Searchable/large sets → `cmdk` Command combobox.                                                                                                                                                                                                                                  |
| **Card**                                 | `rounded-xl border bg-card`. Rest = border + `shadow-xs`; interactive cards add `press` + `hover:shadow-md` and `hover:-translate-y-0.5`. No random shadows. Use `bg-elevated` for nested raised panels.                                                                                                                                                                                                           |
| **Badge**                                | `rounded-full`, icon+text (never color-only). Variants `default/brand/secondary/success/warning/destructive/outline/ghost`. Status maps to a fixed variant table (§ module docs).                                                                                                                                                                                                                                  |
| **Dialog / Drawer / Sheet**              | Desktop = `Dialog`; **mobile = `Drawer`/`Sheet` (bottom sheet, vaul)**. Always close affordance + Esc. Confirm before dismiss with unsaved changes.                                                                                                                                                                                                                                                                |
| **Table**                                | Admin lists. Server-paginated. Hover row state, zebra optional, sortable headers carry `aria-sort`. **Collapses to a card list `< md`.** Sticky header on tall tables.                                                                                                                                                                                                                                             |
| **Tabs**                                 | In-page section switching (product Description/Reviews/Shipping; account sections). Animated active indicator.                                                                                                                                                                                                                                                                                                     |
| **Dropdown**                             | Row actions, account menu. Overflow → "more" menu, never cram.                                                                                                                                                                                                                                                                                                                                                     |
| **Toast (Sonner)**                       | Mounted once in root. `richColors`, top-right. Auto-dismiss 3–5s, `aria-live`, never steals focus.                                                                                                                                                                                                                                                                                                                 |
| **Skeleton**                             | Loading > 300ms. Match final layout dimensions (no CLS). Use `.shimmer` sweep on key blocks.                                                                                                                                                                                                                                                                                                                       |
| **Pagination / Breadcrumb / EmptyState** | List nav, orientation, empty results (icon + message + CTA, `bg-aurora` optional).                                                                                                                                                                                                                                                                                                                                 |

### Shared app components (`src/components/shared/`, built on primitives)

`PriceTag` (tabular currency + strike compare-at), `RatingStars`, `QuantityStepper`,
`EmptyState`, `DataState` (loading/error/empty/data), `ConfirmDialog`, `Pagination`,
`ProductImage` (next/image + aspect-ratio + blur), `PageHeader`, `FormError`, `SubmitButton`.

### Motion components (`src/components/motion/`)

`Reveal` / `Stagger` + `StaggerItem` (scroll-triggered fade-up, reduced-motion safe),
`SmoothScroll` (lenis, storefront root, off on touch + reduced-motion). Prefer these over ad-hoc animation.

### Storefront-specific standards

- **Product card** (`VariantCard`): image in `AspectRatio`, scale-on-hover image, wishlist heart top-right, sale/sold-out badge top-left, quick add-to-cart. `press` + `hover:-translate-y-1 hover:shadow-lg`. Mobile = 2-up grid.
- **Product gallery**: large immersive image, thumbnail rail / embla swipe on mobile, zoom affordance.
- **Charts (admin)**: minimal, brand/neutral palette, gridlines `border`, tooltips on `popover`. Currency `tabular-nums`.
- **Admin widgets**: stat cards (`bg-card`, eyebrow label + big `font-heading` number + trend badge), consistent with storefront cards.

---

## 6. Motion Standards

Motion is **smooth, fast, intentional** — it guides attention and rewards interaction; it never
blocks, distracts, or jitters. **Always honor `prefers-reduced-motion`** (the `Reveal`/`Stagger`
components and globals.css already short-circuit it).

- **Durations:** micro (hover/press) 150–200ms · entrances 350–550ms · page/section reveals ≤ 600ms. Nothing slower than ~600ms.
- **Easing tokens:** `--ease-out-quart` (UI), `--ease-out-expo` (entrances), `--ease-spring` (playful pop). Use these, not linear/default.
- **Hover:** cards lift (`-translate-y-0.5/-1` + `shadow-md/lg`), images scale (`scale-105`), buttons elevate. GPU transforms/opacity only — never animate layout (width/height/top).
- **Press:** `active:scale-[0.97]` on buttons + `.press` utility on tappable cards.
- **Loading:** skeletons matching layout + `.shimmer` sweep (not bare spinners); inline button spinner for mutations.
- **Page transitions:** subtle fade/slide on route change where it adds polish; section content uses `Reveal`/`Stagger` on scroll-in (once).
- **Utilities:** `.reveal`, `.reveal-in`, `.reveal-scale`, `.marquee-track`, `.shimmer`, `.press`, `.glass`, `.bg-aurora`, `.text-gradient` (see globals.css `@theme` + `@layer utilities`).

---

## 7. Form Standards

**react-hook-form + zod** via shadcn `<Form>` (`zodResolver`). Schemas in `src/modules/<m>/schemas/`
and **mirror backend DTO validation exactly**.

- Visible `<FormLabel>` per field (never placeholder-as-label). Required `*`. Validate on blur (`mode: 'onTouched'`); `<FormMessage>` below field.
- Helper text via `<FormDescription>`. Password: show/hide toggle + correct `autoComplete`.
- Submit: `SubmitButton` disables + spinner while `isPending`. Success → toast + navigate/reset. API error → map field errors (§10), focus first invalid field, form-level `<Alert variant="destructive">` for non-field errors.
- Multi-step (checkout, product create): step indicator, back-nav allowed, never lose data on step change.
- Destructive submits → `AlertDialog`, red emphasis, separated from primary. Client zod is UX only; server is authoritative.
- Group related fields with section headings + whitespace; paired fields `sm:grid-cols-2`. Mobile = single column, comfy spacing.

---

## 8. Icon Usage

- **lucide-react only.** No emoji as icons.
- Sizes: inline-with-text `size-4`, default UI `size-5`, feature/empty `size-6`+. Don't mix arbitrary sizes in one layer. Default 2px stroke.
- Decorative → `aria-hidden`; icon-only button → `aria-label`.
- Canonical map: cart `ShoppingBag`, wishlist `Heart`, account `User`, search `Search`, success `CheckCircle2`, error `AlertCircle`, warning `TriangleAlert`, loading `Loader2 animate-spin`, remove `Trash2`, edit `Pencil`, more `MoreHorizontal`, sort `ArrowUpDown`, filter `SlidersHorizontal`. Reuse — no synonyms.

---

## 9. Layout Patterns

Three App Router route-group shells:

- **`(storefront)`** — `AnnouncementBar` + sticky **glass** `SiteHeader` (logo, category `NavigationMenu`, search trigger, wishlist, cart drawer w/ count, account menu, theme toggle) + `SiteFooter`. Mobile: hamburger `Sheet` + sticky `BottomNav`. Cart opens as a `Sheet`. `SmoothScroll` mounts here.
- **`(admin)`** — `/admin/*`. Collapsible left `Sidebar` (≥`lg`, drawer on mobile) + glass top bar (breadcrumb, search, theme, user menu). Same tokens/motion as storefront — premium, product-focused, not a generic dashboard.
- **`(auth)`** — centered single-column `AuthCard` (`max-w-md`), `bg-aurora` brand backdrop, minimal chrome.

Pattern specifics:

- **Listing:** filter sidebar (`lg`) / filter `Sheet` (mobile) + responsive product grid (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`) + server pagination. Filters & sort live in **URL search params**. Sticky toolbar.
- **Product detail:** immersive gallery | **sticky** info column (title, `PriceTag`, variant selectors, `QuantityStepper`, add-to-cart, wishlist) → `Tabs` (details/reviews/shipping) → related grid.
- **Checkout:** multi-step (Address → Shipping/Pickup → Review → Pay) with step indicator; sticky order summary aside on desktop, collapsible on mobile. Minimal, trustworthy.
- **Account:** premium dashboard — left nav, stat/summary cards, clean lists for orders/addresses/wishlist.
- Fixed header reserves body offset; safe-area-aware; lists never hidden behind sticky bars. **No horizontal scroll at any breakpoint.**

---

## 10. API Integration Pattern

Backend: NestJS, **global prefix `/api`**, CORS, JWT access + rotating refresh. **Redesign must not change any of this.**

### 10.1 Envelope (from `AllExceptionsFilter`)

- **Success:** resource/DTO directly; lists are `{ items, total, page, limit, totalPages }` (`PaginatedResult<T>`).
- **Error:** `{ statusCode, code, message, details, path }`. `message` is string | string[]; `code` is stable (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `UNPROCESSABLE_ENTITY`, `TOO_MANY_REQUESTS`…).

### 10.2 fetch client (`src/lib/api/client.ts`)

Base URL `NEXT_PUBLIC_API_URL`; `Authorization: Bearer <access>` from auth store; throws `ApiError` on non-2xx (normalizing `message[]` → field map); **401 → single-flight refresh + retry once**, else clear session + redirect `/sign-in`; `Idempotency-Key` passthrough for checkout.

### 10.3 TanStack Query

One `QueryClientProvider`. Defaults `staleTime` 30s, `retry` 1 (no retry 4xx), `refetchOnWindowFocus` false. **Query-key factory per module** (`queries.ts`), never inline keys. Reads `useQuery`; writes `useMutation` + targeted `invalidateQueries`; optimistic cart/wishlist with rollback `onError`. SSR prefetch + `dehydrate` for SEO (listing/detail).

### 10.4 DataState contract

Every data view handles four states: **Loading** (skeleton matching layout >300ms), **Error** (inline `Alert` + Retry; 401 global), **Empty** (`EmptyState`, never blank), **Data**. Mutations: pending button → toast; 409/422 → field/form errors with recovery path.

---

## 11. State Management

Lowest-power tool that works: **1.** URL params (filters/sort/page/search/tab) · **2.** TanStack Query (all server data — the cache; don't mirror into Zustand) · **3.** `useState`/`useReducer` (ephemeral UI) · **4.** Context (theme, current-user snapshot) · **5.** Zustand only for genuinely-global client state with no server home (auth tokens/session, cart-drawer open, guest-cart buffer). **If the server owns it, it lives in Query.**

---

## 12. Folder Structure

Feature-sliced. A module owns its components/hooks/schemas/queries/types; `components/` + `lib/` hold cross-module shared code.

```
apps/frontend/src/
├── app/
│   ├── (storefront)/   layout · page(home) · shop · category/[slug] · product/[slug] · cart · checkout · search · wishlist · account/*
│   ├── (auth)/         sign-in · sign-up · verify-email · forgot/reset-password
│   ├── (admin)/admin/  dashboard, products, orders, payments, returns, settings, …
│   ├── layout.tsx      root: fonts (Bricolage+Inter), Providers, <Toaster/>
│   └── globals.css     design tokens (§2), motion tokens + utilities (§6)
├── components/
│   ├── ui/             shadcn primitives (vendored, extended)
│   ├── shared/         PriceTag, DataState, EmptyState, Pagination, …
│   ├── storefront/     SiteHeader, SiteFooter, BottomNav, CartDrawer, VariantCard, Hero…
│   ├── layout/         admin sidebar/topbar/guard, theme-toggle
│   └── motion/         Reveal, Stagger, SmoothScroll
├── modules/<module>/   components · hooks · queries.ts · schemas.ts · api.ts · types.ts
├── lib/                api/ · query/ · utils.ts · auth/
├── hooks/  types/  config/
```

---

## 13. Naming Conventions

Component file/identifier `PascalCase`; hook `useX.ts`/`useX`; non-component module file `kebab-case.ts`;
zod `xSchema` + inferred `X`; query-key factory `<entity>Keys`; route folder `kebab-case`/`(group)`/`[param]`;
type `PascalCase` (no `I`); boolean prop `is/has/can`; handler `handleX` (local) / `onX` (prop); constant `SCREAMING_SNAKE`.

---

## Per-module backend alignment (before coding)

1. Read `apps/backend/src/modules/<module>/CLAUDE.md` (endpoints, auth, DTOs). 2. Mirror DTO in `schemas.ts`.
2. Type responses from the entity/DTO; lists `PaginatedResult<T>`. 4. Handle the error envelope via `ApiError`.
3. Money/totals from server. 6. Public vs permissioned routes gate UI **and** rely on server enforcement.

## Pre-delivery checklist (every screen)

- [ ] shadcn primitives + extended variants used; no hand-rolled equivalents
- [ ] Loading (skeleton) / error (retry) / empty (EmptyState) handled
- [ ] Mobile 375px verified; touch ≥44px; **no horizontal scroll**; bottom-sheet on mobile where modal
- [ ] Labels + `<FormMessage>` below field; first invalid focused on error
- [ ] **Semantic tokens only** (no hex / `zinc-x`); `primary`=action, `brand`=accent (not everywhere)
- [ ] Light + dark contrast ≥4.5:1; visible focus ring; `prefers-reduced-motion` respected
- [ ] Motion uses tokens/`Reveal`/`Stagger`; GPU transforms only; ≤600ms
- [ ] lucide icons, canonical map, no emoji; icon-only buttons labeled
- [ ] Query keys via factory; mutations invalidate; **no API/DTO/business-logic change**

```

```
