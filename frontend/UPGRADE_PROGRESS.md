# Inventory Management — Frontend Audit & Fix Progress

Audit start: 2026-09-11 — scope: **frontend only** (`Inventory-Management-Frontend`). Backend
(`inventory-management-backend`, Docker on `:8080`) was treated as read-only and verified against,
never modified.

## How to run

```bash
npm install        # optional; node_modules already present
npm run dev        # dev server on http://localhost:5173 (CORS whitelisted in backend)
```

- API base URL is set in `.env` → `VITE_API_URL=http://localhost:8080/api`
  (was `http://127.0.0.1:8000/api` — pointed at a dead port; **fixed**).
- Dev admin login: `admin@yourcompany.com` / `ChangeMe123!`
- Checks: `npm run build` (passes), `npm run lint` (passes — oxlint native binding on this machine
  needs `Unblock-File` on the `.node` binary once: see git notes).
- No test framework is configured for this frontend (no `test` script in package.json).

## Findings & fixes applied (this session)

### Confirmed errors — FIXED
1. `.env` pointed the API at `http://127.0.0.1:8000/api` (nothing listening). Backend serves
   `http://localhost:8080/api`. → `.env` updated. Verified live: login, `/user`, `/dashboard`,
   products/sales/purchases/suppliers/customers/categories/reports/commissions/recommendations/etc.
   all return HTTP 200 with the exact field shapes the pages consume.
2. `src/routes/AppRoutes.jsx` was dead code with **broken imports and duplicate identifiers** (it
   caused `npm run lint` to fail). It is never imported. → File deleted.
3. Three sidebar nav items had **no route** and silently redirected authenticated users to `/login`:
   - `/recommendations` → `AnalyticsPage`
   - `/analytics/buy-vs-sale` → `Salespurchaseanalytics`
   - `/commissions` → `Commissions`
   All three pages were complete and their endpoints verified; routes added in `src/App.jsx`.
4. **Purchase edit was non-functional**: `Purchases.jsx` passed `purchase={editingPurchase}` but
   `PurchaseForm.jsx` ignored it, so "Edit" opened an empty create form. → `Purchases.jsx` now fetches
   the full purchase (`GET /purchases/{id}`, same pattern as Sales) before opening the form;
   `PurchaseForm.jsx` now accepts/uses the `purchase` prop, prefills supplier/status/lines, and calls
   `PUT /purchases/{id}` (validated against `UpdatePurchaseRequest`) when editing.
5. `PurchaseDetail.jsx` rendered `purchase.user?.role` (a relation object) → `[object Object]`.
   → Now `purchase.user?.role?.role_name`.
6. Dropdowns in Purchase form / Sale form / Stock-history filter only loaded the **first page (10
   items)** of suppliers/products/customers. → `per_page: 100` added for suppliers & products
   (backend reads `per_page`). Note: `CustomerController` hardcodes `paginate(10)` server-side
   (backend is frozen) — customer dropdowns stay capped at 10 until the backend honors `per_page`.
7. Dead routes cleaned from `App.jsx`: duplicate `/products`, `/products/add`, `/products/:id/edit`
   (ProductForm needs modal props and was unreachable as a route), `/purchases-detail` (list page opens
   the detail as a modal, not a route). Kept `/products/:id/view`.
8. Email-change confirmation page (`ConfirmEmailChange`) had **no route**, so links in emails went to
   `/login`. → Public route `/email/confirm/:token` added. Backend `GET /email/confirm/{token}` exists.
9. Catch-all `*` redirected every unknown URL to `/login`, so a wrong URL silently logged users out of
   navigation. → Now renders the existing `NotFound` page.
10. `Dashboard.jsx`: dead `SAMPLE_STATS` branch (const `USE_SAMPLE_DATA=false`) referenced an
    **undefined identifier** — a crash if anyone ever flipped the flag. → Dead branch removed.
11. `service.js`: `productService` had duplicate keys (`getProduct`/`createProduct`/`updateProduct`
    defined twice). → Duplicate block removed (behavior unchanged).
12. `AuthContext.jsx`: unused `use` import removed; `verifyUser(false)` → `verifyUser()`.
13. `Suppliers.jsx`: leftover `console.log("RAW /suppliers response:")` debug line removed.
14. `ProductsList.jsx` category filter loaded only 10 categories → uses `/categories?all=true`
    (backend supports it).
15. `Sales.jsx`: unused `RotateCcw` import removed.
16. **HTTP 429 spam while browsing**: the backend enforces a global 60-requests/minute/user budget
    (`RateLimiter::for('api')`, `throttle:api` on the whole authenticated API). Pages fire 3–5 GETs per
    mount, so fast navigation hit the cap and the UI showed raw `AxiosError`s. → `src/services/api.js`
    now (a) dedupes identical GETs with a 15 s TTL cache + shared in-flight requests (cleared on any
    write), and (b) auto-retries throttled GETs twice with backoff reading `X-RateLimit-Reset`. This
    keeps normal browsing far below 60 req/min and makes transient 429s invisible.

### Not bugs / verified OK
- `useToast()` / `useAlert()` consumers are all correct (some files call `toast.success(...)`, which is
  right — `useToast()` returns the object, unlike `useAlert()`'s `{ confirm }`).
- `user.role.role_name` is returned by both `/login` and `/user` (verified live) — Sidebar admin gating
  works.
- Dashboard chart fields (`sales_trend`, `category_breakdown`, `low_stock_items`, `recent_activity`)
  match `DashboardController` exactly.
- `/products/stats`, `/purchases/stats`, `/sales/stats`, `/stock-histories/stats` all match page reads.
- `extractPaginated` handles both Laravel `{ data: {...paginator} }` and `{ data: [...] }` shapes.

### Known limitations / recommendations (not fixed — backend is frozen, or out of scope)
- **RESOLVED (backend env fix, applied this session):** `/users`, `/users/stats` (and `UserController`
  routes used by the Profile page) returned **HTTP 500** with
  `Cloudinary\Exception\ConfigurationException` because `docker/.env.docker` had `CLOUDINARY_URL=`
  (empty) while the host `.env` had real credentials. The app container resolves
  `CloudinaryImageService` (constructor `new Cloudinary(config('services.cloudinary.url'))`) which
  throws when the URL is empty. Fix applied: copied the `CLOUDINARY_URL` value from
  `inventory-management-backend/.env` into `inventory-management-backend/docker/.env.docker`, added
  `docker/.env.docker` to `.gitignore`, then `docker compose up -d --force-recreate app queue scheduler`.
  Verified live: `/users`, `/users/stats`, `/roles`, `/departments` all return 200.
- Backend API is rate-limited to **60 requests/minute per user** (`RateLimiter::for('api')` in
  `AppServiceProvider`). The 429 storm was fixed (see fix 16): the frontend no longer auto-retries
  throttled requests (each retry burned budget faster) and identical concurrent GETs are deduped via
  in-flight request sharing, so normal page loads stay well under the budget.
- Dashboard stat cards read `*_change` fields that the backend never returns — deltas are silently
  omitted (UI degrades gracefully). Would need a backend change to surface trends.
- `LanguageContext` / `ThemeContext` (i18n + dark mode) are implemented but never mounted, and no
  component consumes them — dead feature, not mounted intentionally.
- Empty files that render nothing if ever routed/imported: `pages/Settings.jsx`, `pages/Inventory.jsx`,
  `components/Modal.jsx`, `components/Loading.jsx`, `components/DataTable.jsx`,
  `services/productServices.js`, `services/salesService.js`. Safe to delete or implement later.
- `GlobalSearch.jsx` is imported by `Navbar.jsx` but never rendered; its navigation targets
  (`/products/{id}`, `/categories/{id}`, `/suppliers/{id}`, `/customers/{id}`, `/sales/{id}`,
  `/purchases/{id}`) don't match existing routes. Enable only if detail routes are added.
- `Navbar.jsx` purchase search navigates to `/purchases/{id}` which has no route (Purchases uses a
  modal instead).
- `ProtectedRoute` checks token presence only (not validity) — relies on backend + the axios 401
  interceptor to bounce stale sessions.
- `PurchaseForm` create/edit does not send `purchase_date` (backend nullable; defaults to today via DB
  where applicable).
- Bundler warning: main JS chunk >500 kB — code-splitting via `React.lazy` is a future improvement.

## Remaining work for next session
1. Manual login + click-through in a browser: Users page, profile update (avatar upload), Products CRUD,
   Purchase create/edit/delete, Sales create/edit/delete, Stock History, Reports, Analytics
   (recommendations + buy-vs-sale), Commissions, email-change confirm link.
2. Decide whether to implement customer-dropdown pagination (backend currently capped at 10).
3. Optional: mount `LanguageProvider`/`ThemeProvider` or remove the dead files listed above.