# Backend Upgrade Progress — Oracle → Laravel 13 / PostgreSQL / Redis / Docker

Tracking file for the backend upgrade. This project migrated from a legacy
Oracle + OCI8 stack to **Laravel 13 + PostgreSQL 16 + Redis + Docker**.

**Last updated:** 2026-09-11

---

## Goal

Replace the Oracle database and OCI8 driver with PostgreSQL, move cache/session/
queue to Redis, containerize the app with Docker Compose, and harden the API
(SQL injection, rate limiting, auth) — all **without touching the frontend** and
without changing the API contract.

---

## Completed work (verified)

### 1. Dependency / package swap
- `composer.json` — removed `yajra/laravel-oci8`, added `predis/predis` (^3.6).
- `composer.lock` — regenerated. `predis 3.6.0` and `cloudinary/cloudinary_php 3.1.3`
  present; `yajra/laravel-oci8` gone.
- App boots on `Laravel Framework 13.19.0`.

### 2. Configuration (config/ + .env.example)
- `config/oracle.php` deleted.
- `config/database.php` — PostgreSQL connection is the default; Redis config uses `predis`.
- `config/cache.php` — default store `redis`.
- `config/session.php` — default driver `redis`.
- `config/queue.php` — default `redis`; batching/failed tables default to `pgsql`.
- `config/services.php` — added `cloudinary` block (`env('CLOUDINARY_URL')`).
- `.env.example` — rewritten for pgsql + redis + cloudinary.

### 3. Docker stack (new)
- `Dockerfile` — `php:8.3-fpm-alpine`, pdo_pgsql/pgsql, composer 2, non-root user.
- `docker-compose.yml` — app, queue, scheduler, redis, postgres:16, nginx (port 8080).
- `docker/.env.docker`, `docker/entrypoint.sh` (idempotent migrate loop),
  `docker/nginx/default.conf`, `.dockerignore`.
- `docker compose config` validates clean.

### 4. SQL injection hardening
- Base `Controller` gained `escapeLike()` (escapes `%` and `_`).
- Applied to every `LIKE` search: Category, Product, Purchase, Sale, Supplier,
  User, Department, Role, Customer, Search, and `Api\*` controllers.

### 5. Oracle → PostgreSQL SQL conversion (runtime queries)
- `Api\DepartmentController` — `TO_NUMBER(REGEXP_SUBSTR(...))` →
  `COALESCE(CAST(REGEXP_REPLACE(code,'[^0-9]','','g') AS INTEGER),0) DESC`.
- `Services\PurchaseRecommendationService` — `TRUNC(sale_date)` →
  `DATE_TRUNC('day', sale_date)::date`.
- `Api\DashboardController` — `DATE_TRUNC` + `TO_CHAR` (PostgreSQL-native).
- `Api\ReportController` — `TO_CHAR` (works identically on PostgreSQL).
- `SaleController::friendlyErrorMessage` — `ORA-02291/ORA-00001/ORA-xxx` patterns
  replaced with PostgreSQL equivalents (`violates foreign key constraint`,
  `duplicate key value violates unique constraint`, `Stock cannot be negative`).
- `UserController` — `ORA-20001` check replaced with the actual trigger message
  (`Salary must be between …`).

### 6. Migrations (all 20 verified on PostgreSQL 16)
- `purchase_details.subtotal` and `sale_details.subtotal` now `default(0)`.
- `2026_07_19_*_add_salary_range_trigger` — PL/pgSQL salary-range trigger,
  guarded to `pgsql` only.
- `2026_07_27_*_create_oracle_converted_db_objects` — PostgreSQL views
  (`vw_product_inventory`, `vw_purchase_summary`, `vw_sales_summary`, …), 5 functions,
  4 procedures, 5 triggers (purchase/sale totals, negative-stock guard, updated_at,
  stock history), guarded to `pgsql` only.
- **Verified:** `migrate:fresh`, `migrate:rollback`, re-`migrate` all succeed on a
  fresh PostgreSQL 16 container.

### 7. Security / correctness fixes
- `routes/api.php` — `throttle:5,1` on `login`, `forgot-password`,
  `users/{user}/verify-password`, 2FA verify.
- `UserController::verifyPassword` — now refuses verifying any account other than
  the caller's own (anti brute-force).
- `UserController::{store,update}` — new image uploaded **before** old one deleted;
  `destroy` deletes the user record before attempting image cleanup (no stray
  orphan on FK failure).
- `SupplierController::store` — uses `$validated` (was `$request->validated()` bug).
- `CloudinaryImageService` / `ConfirmNewEmail` / `AppServiceProvider` — no raw
  `env()` calls in app code; use `config()`.
- Removed temporary `DB::listen` SQL-debug logging from `AppServiceProvider`.
- `routes/console.php` — added daily `cleanup-expired-email-changes` schedule.

---

## Completed this session (2026-09-11)

### Bugs found in previous changes (fixed)
1. **`subtotal` not fillable on detail models** — `PurchaseController` and
   `SaleController` write `subtotal` on `PurchaseDetail`/`SaleDetail::create()`,
   but the models did not list it in `$fillable`. With
   `Model::preventSilentlyDiscardingAttributes()` on (AppServiceProvider), creation
   **threw MassAssignmentException** in dev; in prod it silently wrote 0.
   → Added `'subtotal'` to both `$fillable` arrays.
2. **Negative sale total on detail wipe** — the `trg_sale_total` trigger computed
   `SUM(details) - discount` even when all line items were deleted, leaving
   `total_amount = -discount`.
   → Wrapped in a `CASE ... WHEN EXISTS(details)` so an empty sale nets `0`.
3. **Broken indentation** in `PurchaseController` (`foreach`/`if` at column 0).
4. `routes/console.php` missing trailing newline.

### Cleanup
- Stale Oracle-era comments rewritten across `CommissionService`,
  `PurchaseController`, `SearchController`, `TwoFactorController`,
  `Api\ReportController`.
- Pint formatting pass over all upgrade-touched files (controllers, services,
  models, configs).

---

## Files changed (whole upgrade)

Controllers — `app/Http/Controllers/` `AuthController`, `CategoryController`,
`ProductController`, `PurchaseController`, `SaleController`, `SearchController`,
`SupplierController`, `TwoFactorController`, `UserController`, `Controller`,
`Api/{Customer,Dashboard,Department,Report,Role}Controller`.

Models / Services — `app/Models/Supplier` (+`PurchaseDetail`, `SaleDetail` this
session), `app/Services/{CloudinaryImageService,CommissionService,
PurchaseRecommendationService}`.

Other — `app/Mail/ConfirmNewEmail.php`, `app/Providers/AppServiceProvider.php`,
`composer.{json,lock}`, `config/{cache,database,oracle(-deleted),queue,services,
session}.php`, `.env.example`, `routes/{api,console}.php`, migrations:
`2026_07_01_000010`, `2026_07_01_000012`, `2026_07_19_023335`,
`2026_07_27_092536`.

Docker (new/untracked): `Dockerfile`, `docker-compose.yml`, `docker/`,
`.dockerignore`.

---

## Final hardening session (2026-09-11)

### Security / performance / patterns
- **API rate limiter** — `RateLimiter::for('api', …)` (60 req/min keyed by user
  id, or IP pre-auth) registered in `AppServiceProvider`; applied to the whole
  authenticated API group via `throttle:api`.
- **Security headers** — new `app/Http/Middleware/SecurityHeaders.php`
  (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy,
  COOP, HSTS when https) appended globally in `bootstrap/app.php`.
- **CORS** — `config/cors.php` tightened: explicit methods/headers, `max_age=600`.
- **Timing-safe login** — `AuthController` compares against a dummy bcrypt hash for
  unknown emails so response time doesn't leak account existence; added
  `profile()` and `permissions()` endpoints used by the app.
- **`routes/api.php` rewritten** — proper imports, no inline closures, `throttle`
  on login/forgot/reset/verify-password/2FA, permission groups aligned with the
  actual permission keys (`audit-logs` → `view`).
- **Friendly errors everywhere** — base `Controller::friendlyErrorMessage()`
  (logs the raw exception, maps PG trigger / FK / unique / salary messages);
  `SaleController` and `PurchaseController` route store/update/destroy through it.
- **Performance indexes** — `2026_09_11_000001_add_performance_indexes.php`
  (purchases/sales status+date, audit_logs, pending_email_changes, stock_history,
  pg_trgm GIN on searchable text columns), PG-only, applied cleanly.

### Inventory correctness (real bug fix)
- Eloquent controllers never updated `products.quantity_in_stock`; only unused
  Oracle-era stored procedures did. New `app/Services/InventoryService.php`
  wired into `PurchaseController` / `SaleController` (same transaction as the
  header/details):
  - Purchase `Received` → stock in; leaving `Received` (update/destroy) → stock out.
  - Sale `Completed` → stock out with an insufficient-stock pre-check
    (`RuntimeException`, mapped to a friendly message, rolls back atomically);
    leaving `Completed` (update/destroy) → stock returned.
  - Status/detail changes reconcile old vs new quantities inside the transaction.
  - The PG `trg_prevent_negative_stock` trigger remains as the DB-level safety net.

### Tests & style
- **42 feature tests** (was: only example tests): `AuthTest` (11), `ProductApiTest`
  (8), `PurchaseApiTest` (11), `SaleApiTest` (12) — covering auth/401/revocation,
  CRUD, audit-log permissions, purchase/sale totals, commission (5% of 180=9.00),
  and the new stock in/out/reconcile/oversell-rollback paths. All pass on
  SQLite in-memory.
- **Pint** pass over the whole codebase (previously failing files: Http/Requests,
  middleware, models, `routes/web.php`, `config/cors.php`, controllers).

### Docker / env
- Full stack rebuilt and verified live on **PostgreSQL 16 + Redis 7 + PHP-FPM +
  nginx** (`inventory-app/db/redis/queue/scheduler/nginx`, DB+Redis healthy).
- DB recreated from scratch: `migrate:fresh --seed` — **21/21 migrations**
  (incl. the new performance-indexes migration) and the seeder ran cleanly.
- `/up` health probe replaced the framework blade-based route (blade template is
  stripped from the image) with a minimal **JSON** probe that pings the DB —
  robust for load balancers/monitors without an `Accept: application/json` header.
- `docker-compose.yml`: postgres now published to the host on **55432** for local
  tooling; `.env` DB block repointed at the Docker database (Supabase creds were
  stale and are gone). Local `artisan` commands now work against the same DB.
- **HTTP smoke test: 28/28 pass** against `http://localhost:8080` (health, login,
  401, wrong password, profile, permissions, dashboard, categories/products/
  suppliers/customers CRUD, purchase total via PG trigger (140), stats, sale total
  recomputed (180, client 999 ignored), PG stock decrement 115→107, commission
  5% → 9.00, oversell → 500 + atomic rollback, reports, case-insensitive search,
  login brute-force 429 after 6 rapid attempts, logout revocation).

---

## Tests performed (2026-09-11)

| Check | Result |
|-------|--------|
| `php artisan test` (SQLite in-memory, 42 feature tests) | 42/42 pass, 103 assertions |
| Pint over the whole codebase | clean |
| `docker compose config` | valid |
| `php artisan route:list` | all API routes registered |
| `migrate:fresh` on clean PostgreSQL 16 | 21/21 migrations OK |
| `migrate:rollback` + re-`migrate` on PG16 | drop/create of views/fns/triggers OK |
| Runtime queries on PG16 (`DATE_TRUNC`, `TO_CHAR`, scalar subqueries, regexp order) | all execute |
| DB-level functional tests on PG16: salary-range trigger, purchase-total trigger (900), negative-stock trigger, sale-total trigger (200 after discount), commission calc (10), department numeric ordering, case-insensitive global search, DatabaseSeeder, detail-delete recal | 9/9 pass |
| End-to-end HTTP smoke test on the Docker stack | 28/28 pass |
| Local `artisan` against the Docker DB (port 55432) | connects, migrations green |

---

## Notes / status

1. Backend upgrade is **functionally complete and verified** end-to-end.
2. `.env` now points at the Docker PostgreSQL (localhost:55432); MAIL_* and
   CLOUDINARY_URL are unchanged and still valid.
3. Production duties remain env-level, not code: remove the published 55432 port,
   rotate DB/mail credentials, set `APP_ENV=production` + `APP_DEBUG=false`,
   frontend in a separate container/service.