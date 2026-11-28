# Progress

## Stage 1 - Foundation (completed)
- TypeScript conversion of the codebase.
- Design tokens: page `#222220`, panel `#171715`, bone `#d9d6cf`, silver `#a9adb1`, crimson `#b3122b`, bright crimson `#e0314b`. Fonts: UnifrakturCook (headlines/names), Anton (prices/buttons), IBM Plex Mono (labels).
- `components/GrainOverlay.tsx`, `components/Skeleton.tsx`.
- `lib/db.ts`: mysql2/promise pool, `query<T>`, `withTransaction`.
- `db/schema.sql`, `db/drop.sql`, `scripts/load-env.js`, `scripts/migrate.js`, `scripts/seed.js`.
- Scripts: `db:up`, `db:down`, `db:seed`, `db:reset`.
- Typecheck, lint, build all pass. Git repo initialized (no commits yet).

## Stage 2 - Layout (completed)
- Promo bar, header, footer, `components/Logo.tsx` (renders `public/brand/logo-bone.png` via next/image).
- Mobile menu.
- Brand name rendered only via `Logo.tsx`; never in UnifrakturCook. Red present on every page.
- Fixed `.gitignore`: `.env*` -> `.env` / `.env.*` / `!.env.example`.

## Stage 3 - Homepage hero and scatter field (completed)
### Database
- Added idempotent columns to `products`: `show_on_home` (BOOLEAN, default FALSE), `home_x` (DECIMAL 5,2), `home_y` (DECIMAL 5,2), `home_rot` (DECIMAL 4,2). Superseded stage-1 `scatter_x`/`scatter_y`/`rotation` retained (not dropped).
- `scripts/migrate.js`: `ensureHomeColumns()` guards each ALTER via `information_schema.columns` so re-running `db:up` is safe.
- `scripts/seed.js`: all 8 SAMPLE products flagged `show_on_home = 1` with non-overlapping home positions in two staggered columns (left x ~12-26, y 13-85; right x ~60-74, y 20-86), rotations within +/-7 deg.

### Geometry (`lib/scatter.ts`)
- Constants: `FIELD_WIDTH=1000`, `FIELD_HEIGHT=1250`, `FIELD_ASPECT=0.8`, `CARD_WIDTH_PCT=15`, `CARD_ASPECT=3/4`, `DISPLACE_MIN=120`, `DISPLACE_MAX=300`, `DISPLACE_ROT=20`, `HOME_ROT_MAX=8`.
- `hashId`: FNV-1a 32-bit, deterministic across server/client (no Math.random).
- `displacedFor(id, homeX, homeY)`: pushes card radially outward 120-300px, rot in [-20, +20], rounded for SSR determinism.
- `cardAabb`, `aabbOverlap`: axis-aligned bbox helpers for overlap checks.
- `HomeProduct` type.

### Data (`lib/products.ts`)
- `getHomeProducts()`: `SELECT ... WHERE show_on_home = 1 ORDER BY id`, DECIMAL -> number conversion, returns `[]` on error (no crash).

### Geometry test (`scripts/test-scatter.js`)
- Mirrors `lib/scatter.ts` math; validates 8 home positions: in-bounds, tilt <= 8 deg, cards inside field, no overlaps (with 8px gap), displaced distance in [120, 300]px, |rot| <= 20, determinism.
- Added `npm run test:scatter` script.
- Result: all checks passed (8 cards).

### UI (`components/ScatterField.tsx`, `app/page.tsx`)
- Desktop: left hero column + right `ScatterField`; mobile: stacked (headline first, full-width field below).
- Left copy: "Wear" in UnifrakturCook + "the dark." in `#e0314b`, subline "Alternative fashion. Reimagined in Pakistan.", square-corner outlined "Explore the collection" link to `/products` with static SVG arrow.
- Card: `#171715` panel, thin silver border, `rounded-none`, small crimson corner tab, `PHOTO` placeholder, upright (counter-rotated) name + price label revealed on hover/focus (desktop) and first tap (mobile, second tap navigates to `/products/[slug]`).
- `group` class on card link for `group-hover:opacity-100`.
- Hydration-safe: `xPercent: -50, yPercent: -50` in Motion with `x, y, rotate`; no static `transform` translation conflict; `suppressHydrationWarning` on `motion.a`.
- Spring `{ type: "spring", stiffness: 60, damping: 18 }` with `delay: index * 0.04` (~40ms stagger).
- Central 40% desktop trigger zone (onMouseEnter); mobile IntersectionObserver at 0.4 threshold + first touch.
- `useReducedMotion()` -> immediate home positions (duration 0).
- Non-empty fallback when `products.length === 0`.

### Verification
- `npm run typecheck` - pass.
- `npm run lint` - pass.
- `npm run build` - pass (Next.js 16.4.6, Turbopack).
- `npm run test:scatter` - pass (8 cards, all geometry checks).
- Responsive layout verified at 390px / 1024px / 1920px (`grid lg:grid-cols-2`, field full-width on mobile).
- No commits made. No changes to Stage 2 header/nav/logo/footer. `orderflow` DB untouched. No ORM installed.

## Stage 10 - Admin panel scoping (inspect only, no code written)
- Goal: scope the admin panel. No code changed; this stage is documentation only.
- Docs: `docs/PROGRESS.md` only. No SRS/spec file. Nothing describes the admin panel yet (no features, roles, order or product management documented).
- Schema (`db/schema.sql`, applied via `scripts/migrate.js`): tables `settings`, `categories`, `drops`, `products`, `discount_codes`, `orders`, `order_items`. No `admins`/`users` table exists. An `orders` table exists (full checkout model: `payment_status`, `order_status`, `tracking_id`, `rejection_reason`, `discount_code_id` FK, plus `order_items`).
- Routes: no `app/admin/` anywhere; no login/auth page; no `middleware.ts` or `proxy.ts`; no session/cookie/jwt code. Only API route is `app/api/orders/route.ts` (POST, creates order + items in a transaction). `app/dev` has only the temporary `app/dev/fonts/page.tsx` font-test page.
- Product reads: `lib/products.ts` (`getAllProducts`, `getProductBySlug`, `searchProducts`, `getHomeProducts`), `lib/settings.ts` (`getSettings`), `app/api/orders/route.ts` (POST verifies products). All via `query<T>`/`withTransaction` in `lib/db.ts` (mysql2/promise). No ORM. Storefront read helpers swallow errors and return `[]`/`null`, which would hide failures from an admin UI.
- Installed helpers: `bcryptjs` (+types), `zod`, `react-hook-form`, `@hookform/resolvers`, `mysql2`. No auth library (next-auth/better-auth/jose), no UI kit, no upload library, no data-grid.
- Proposed admin stage order (smallest first): A) schema+migration (admins table) -> B) auth core (login, session, proxy) -> C) admin layout+dashboard -> D) products management (add a write path - none exists) -> E) orders management -> F) discounts+settings.