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

## Stage 11 - Admin DB setup and dashboard (completed)
- Schema migrations (`db/admin.sql`, `db/admin-drop.sql`): added `admins` table (id, email, password_hash, created_at), `stock_audit` table (id, product_id, admin_user_id, change_type, old_stock, new_stock, adjustment, reason, reference_type, reference_id, created_at), and `settings` table extensions for announcement banner + featured products.
- `scripts/migrate.js`: `ensureAdminTables()` creates `admins` and `stock_audit` with idempotent `information_schema` checks; `ensureSettingsColumns()` adds `announcement_text`, `announcement_active`, `featured_product_ids` (JSON) to settings.
- `scripts/seed.js`: seeds default admin (`admin@veigin.com` / `admin123` bcrypt hash) and default settings row.
- Auth core (`lib/admin-auth.ts`, `lib/admin-paths.ts`): `verifySession()` reads `adminSession` cookie, validates SHA-256 token against DB, returns `{ adminId, email }`. `createSession()` hashes token with SHA-256, stores with 7-day expiry. Middleware `app/(admin)/admin/proxy.ts` protects all `/admin/*` routes, redirects to `/admin/login` on invalid/missing session.
- Login page (`app/(admin)/admin/login/page.tsx`): Server Action `loginAction` validates credentials with bcrypt, sets `adminSession` cookie (HttpOnly, Secure, SameSite=Lax), redirects to `/admin`.
- Dashboard (`app/(admin)/admin/page.tsx`): stat cards (products, low stock, pending orders, total revenue), recent orders table, quick action links. Uses `lib/admin/dashboard.ts` helpers.
- Admin shell (`components/AdminShell.tsx`): responsive layout with sidebar nav (Overview, Products, Inventory, Orders, Customers, Discounts, Storefront, Settings), user dropdown with logout form action. CSS custom properties design system scoped to `.admin-shell` (colors, spacing, typography, components: btn, input, select, table, badge, card, stats-grid, stat, form-group, label, empty-state).
- Verification: `npm run typecheck` pass, `npm run lint` pass, `npm run build` pass (Next.js 16.4.6, Turbopack). No commits made for Stage 11.

## Stage 12 - Complete admin panel 8 pages (completed)
- **Products** (`app/(admin)/admin/products/page.tsx`): full CRUD with modal create/edit forms (Zod + react-hook-form), image URL field, category/drop select, stock/availability/restockable toggles, compare-at-price, featured flag, search/filter/pagination (20/page), soft-delete (archive) with confirmation modal (`DeleteProductButton.tsx`).
- **Inventory** (`app/(admin)/admin/inventory/page.tsx`): stock-focused table with Adjust Stock modal (React Context pattern via `AdjustStockProvider`/`useAdjustStock` hook, Server Action `adjustStockAction` logs to `stock_audit`), availability dropdown per row, category pill filter bar, stock status filter (In Stock/Low/Out), summary stat cards (total/in-stock/low/out), search + pagination.
- **Orders** (`app/(admin)/admin/orders/page.tsx`): searchable/filterable order list (by order #, name, email, phone; payment status + order status dropdowns), click-to-expand detail modal with full order info (items, totals, shipping), valid status transitions enforced server-side (`VALID_STATUS_TRANSITIONS`, `PAYMENT_STATUS_TRANSITIONS`), tracking ID entry auto-sets order_status to `dispatched`, payment proof URL + Easypaisa transaction ID fields, cancellation restores stock + audit log, pagination.
- **Customers** (`app/(admin)/admin/customers/page.tsx`): searchable directory (email, name, phone, city), filter by has-orders/guest, detail modal with contact info, addresses extracted from orders (most recent = default), order history table with status badges, pagination.
- **Discounts** (`app/(admin)/admin/discounts/page.tsx`): CRUD for discount codes (percentage/fixed, value, usage limit, min order, active dates, active toggle), validation prevents overlap of active percentage codes, used_count display, delete only allowed when `used_count === 0`, search + pagination, success banners.
- **Storefront** (`app/(admin)/admin/storefront/page.tsx`): announcement banner editor (text + active toggle, persisted to `settings`), featured products grid (multi-select from available products, drag-to-reorder via up/down buttons, stored as JSON array in `settings.featured_product_ids`).
- **Settings** (`app/(admin)/admin/settings/page.tsx`): site config (name, tagline, currency, contact email/phone, address), SEO defaults (meta title/description, OG image), maintenance mode toggle, all persisted to `settings` table (single row, upsert).
- **AdjustStockModal** (`components/AdjustStockModal.tsx`): React Context provider pattern (`AdjustStockProvider` wraps page content, `useAdjustStock` hook opens modal with selected product), form validates adjustment won't make stock negative, reason field, Server Action `adjustStockAction` updates product + `stock_audit` in transaction.
- **DeleteProductButton** (`components/DeleteProductButton.tsx`): confirm-then-submit pattern, accessible (focus management, keyboard support), no unused props.
- Verification: `npm run typecheck` pass, `npm run lint` pass (warnings only for Next.js navigation patterns and `<img>` elements - pre-existing), `npm run build` pass (Next.js 16.4.6, Turbopack). All 8 admin pages functional with real DB-backed data, no fake metrics or placeholder controls.

## Stage 2 (Checkout & Order Safety) - Completed
- **Transactional Checkout** (`app/api/orders/route.ts`): All checkout operations wrapped in `withTransaction()` from `lib/db.ts`.
- **Row Locking**: Added `FOR UPDATE` to product SELECT query to prevent race conditions.
- **Server-side Price Calculation**: Prices and totals calculated server-side using verified database values (not client-submitted prices).
- **Stock Validation**: Stock checked server-side before order creation; quantity capped at available stock.
- **Atomic Stock Deduction**: Stock decremented within the same transaction as order creation.
- **Stock Audit Logging**: Each stock deduction creates an entry in `stock_audit` with `change_type = 'order'`, linking to the order via `reference_id`.
- **Rollback on Failure**: Transaction rolls back all changes if any step fails.
- **Concurrency Test** (`scripts/test-concurrency.js`): Repeatable test proving two simultaneous checkout requests cannot both purchase the last unit.
  - Test creates product with stock = 1
  - Runs two concurrent checkout requests
  - Verifies only one order succeeds, stock reaches 0
  - Result: ✅ PASSED
- **Files Changed**:
  - `app/api/orders/route.ts` - Added `FOR UPDATE`, stock deduction, audit logging
  - `app/(admin)/admin/inventory/actions.ts` - Added stock_audit insert for manual adjustments
  - `scripts/test-concurrency.js` - New concurrency test script
- **Verification**:
  - `npm run typecheck` - PASS
  - `npm run lint` - PASS (14 pre-existing warnings only)
  - `npm run build` - PASS
  - Concurrency test - PASS
- **Products** (`app/(admin)/admin/products/page.tsx`): full CRUD with modal create/edit forms (Zod + react-hook-form), image URL field, category/drop select, stock/availability/restockable toggles, compare-at-price, featured flag, search/filter/pagination (20/page), soft-delete (archive) with confirmation modal (`DeleteProductButton.tsx`).
- **Inventory** (`app/(admin)/admin/inventory/page.tsx`): stock-focused table with Adjust Stock modal (React Context pattern via `AdjustStockProvider`/`useAdjustStock` hook, Server Action `adjustStockAction` logs to `stock_audit`), availability dropdown per row, category pill filter bar, stock status filter (In Stock/Low/Out), summary stat cards (total/in-stock/low/out), search + pagination.
- **Orders** (`app/(admin)/admin/orders/page.tsx`): searchable/filterable order list (by order #, name, email, phone; payment status + order status dropdowns), click-to-expand detail modal with full order info (items, totals, shipping), valid status transitions enforced server-side (`VALID_STATUS_TRANSITIONS`, `PAYMENT_STATUS_TRANSITIONS`), tracking ID entry auto-sets order_status to `dispatched`, payment proof URL + Easypaisa transaction ID fields, cancellation restores stock + audit log, pagination.
- **Customers** (`app/(admin)/admin/customers/page.tsx`): searchable directory (email, name, phone, city), filter by has-orders/guest, detail modal with contact info, addresses extracted from orders (most recent = default), order history table with status badges, pagination.
- **Discounts** (`app/(admin)/admin/discounts/page.tsx`): CRUD for discount codes (percentage/fixed, value, usage limit, min order, active dates, active toggle), validation prevents overlap of active percentage codes, used_count display, delete only allowed when `used_count === 0`, search + pagination, success banners.
- **Storefront** (`app/(admin)/admin/storefront/page.tsx`): announcement banner editor (text + active toggle, persisted to `settings`), featured products grid (multi-select from available products, drag-to-reorder via up/down buttons, stored as JSON array in `settings.featured_product_ids`).
- **Settings** (`app/(admin)/admin/settings/page.tsx`): site config (name, tagline, currency, contact email/phone, address), SEO defaults (meta title/description, OG image), maintenance mode toggle, all persisted to `settings` table (single row, upsert).
- **AdjustStockModal** (`components/AdjustStockModal.tsx`): React Context provider pattern (`AdjustStockProvider` wraps page content, `useAdjustStock` hook opens modal with selected product), form validates adjustment won't make stock negative, reason field, Server Action `adjustStockAction` updates product + `stock_audit` in transaction.
- **DeleteProductButton** (`components/DeleteProductButton.tsx`): confirm-then-submit pattern, accessible (focus management, keyboard support), no unused props.
- Verification: `npm run typecheck` pass, `npm run lint` pass (warnings only for Next.js navigation patterns and `<img>` elements - pre-existing), `npm run build` pass (Next.js 16.4.6, Turbopack). All 8 admin pages functional with real DB-backed data, no fake metrics or placeholder controls.