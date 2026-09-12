# Inventory Management System

[![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://www.php.net)

A modern, full-stack **Inventory Management System** built for a mid-size trading operation. The system integrates a React admin console, a Laravel RESTful API, and PostgreSQL/Redis persistence orchestrated with Docker Compose. It covers products, categories, suppliers, purchases, sales, stock movement, customers, departments, users, role-based access control, reporting, commission settlement, and full audit trails.

---

## 1. System Architecture

Two independent application layers communicate over a standardized REST API (`/api`):

```mermaid
flowchart LR
    subgraph Clients["Presentation Layer (Browser)"]
        AB["Admin Console<br/>(React 19 + Vite)<br/>Port :5173"]
    end

    subgraph Gateway["Reverse Proxy"]
        NG["Nginx Proxy<br/>Port :8080"]
    end

    subgraph BackendServices["Backend Application Tier (Docker)"]
        API["Laravel 13 REST API<br/>(PHP 8.3-FPM)"]
        QW["Queue Worker<br/>(artisan queue:work redis)"]
        SCH["Scheduler Daemon<br/>(artisan schedule:work)"]
    end

    subgraph DataStorage["Persistence & Cache"]
        PG[("PostgreSQL 16<br/>Host port :55432")]
        RD[("Redis 7-Alpine<br/>Port :6379")]
    end

    subgraph External["Third-Party Providers"]
        CDN["Cloudinary CDN<br/>(Images & Avatars)"]
    end

    AB -- "HTTPS / JSON" --> NG
    NG --> API
    API --> PG
    API --> RD
    API --> CDN
    QW --> RD
    QW --> PG
    SCH --> API
```

---

## 2. Technology Stack

| Layer | Technologies | Key Packages & Libraries |
| --- | --- | --- |
| **Backend API** | PHP 8.3, Laravel 13.8 | Laravel Sanctum, Cloudinary PHP, Pragmarx Google2FA, Predis, PHPUnit 12 |
| **Frontend Console** | React 19, Vite 8, Tailwind CSS 4 | React Router 7, Axios, Recharts, jsPDF, qrcode, Framer Motion, Lucide React, DaisyUI |
| **Database** | PostgreSQL 16 | Triggers, Views, Performance Indexes, Salary-range check constraint |
| **Cache & Queues** | Redis 7-Alpine | Session storage, Rate limiting, Redis-backed asynchronous job queues |
| **DevOps & Containers** | Docker Compose | 6 microservices (`app`, `queue`, `scheduler`, `postgres`, `redis`, `nginx`) |

---

## 3. Repository Structure

```text
inventory-management-backend/     # Laravel REST API (/api)
├── app/
│   ├── Http/Controllers/         # Auth, 2FA, Products, Sales, Purchases, Reports, ...
│   ├── Http/Middleware/          # CheckPermission, EnsureUserHasRole, SecurityHeaders
│   ├── Models/                   # Eloquent models + Auditable concern
│   ├── Services/                 # CloudinaryImage, Commission, Inventory, Recommendation
│   └── Support/Permissions.php   # Role-permission matrix
├── config/
│   └── permissions.php           # Per-role access levels (full/view/none) per resource
├── database/
│   ├── migrations/               # 25+ migrations incl. views, triggers, indexes
│   └── seeders/                  # DatabaseSeeder (Admin demo account)
├── docker/                       # env_file for the Compose stack + Nginx config
├── routes/
│   └── api.php                   # Full REST API route table
├── tests/                        # Feature + Unit suites
├── docker-compose.yml            # 6-service orchestration definition
└── Dockerfile                    # PHP 8.3-FPM-Alpine image

inventory-management-frontend/    # React admin console (Port 5173)
├── src/
│   ├── pages/                    # Dashboard, Products, Sales, Purchases, Reports, ...
│   ├── components/               # Navbar, Sidebar, Modal, Toasts, Alerts, Search
│   ├── contexts/                 # Auth, LowStock, Language, Theme
│   ├── services/                 # api.js, service.js (axios layer)
│   └── App.jsx                   # Route table (SPA with ProtectedRoute)
└── vite.config.js
```

> **Note:** The two applications live in sibling folders (`inventory-management-backend` and
> `inventory-management-frontend`). The commands below cover provisioning both.

---

## 4. Environment Variables

Copy each `.env.example` to `.env` before starting the corresponding application.

| Variable | Required For | Example / Default |
| --- | --- | --- |
| **`APP_NAME`** | Backend: Application title | `"InventoryManagement"` |
| **`APP_ENV`** | Backend: Runtime environment | `local` |
| **`APP_KEY`** | Backend: 32-byte encryption key | `base64:...` *(generate via `php artisan key:generate`)* |
| **`APP_DEBUG`** | Backend: Debug mode | `true` *(local)* |
| **`APP_URL`** | Backend: Application root URL | `http://localhost:8080` |
| **`FRONTEND_URL`** | Backend: Allowed CORS origin | `http://localhost:5173` |
| **`DB_CONNECTION`** | Backend: Database driver | `pgsql` |
| **`DB_HOST`** | Backend: Database hostname | `db` *(Docker)* / `127.0.0.1` *(host)* |
| **`DB_PORT`** | Backend: Database port | `5432` *(Docker internal)* / `55432` *(host mapped)* |
| **`DB_DATABASE`** | Backend: Database name | `inventory_db` |
| **`DB_USERNAME`** | Backend: Database user | `inventory` |
| **`DB_PASSWORD`** | Backend: Database password | `inventory` |
| **`CACHE_STORE`** | Backend: Cache repository driver | `redis` |
| **`QUEUE_CONNECTION`** | Backend: Async queue connection | `redis` |
| **`SESSION_DRIVER`** | Backend: Session driver | `redis` |
| **`REDIS_HOST`** | Backend: Redis cache host | `redis` *(Docker)* |
| **`REDIS_PORT`** | Backend: Redis port | `6379` |
| **`MAIL_MAILER`** | Backend: Transactional mail driver | `brevo` *(production-like)* / `log` *(local testing)* |
| **`BREVO_API_KEY`** | Backend: Brevo (formerly Sendinblue) API key | `xkeysib-...` *(required for transactional email)* |
| **`MAIL_FROM_ADDRESS`** | Backend: Sender email address | `santinoeurn0601@gmail.com` |
| **`MAIL_FROM_NAME`** | Backend: Sender display name | `"Hotel Management System"` |
| **`CLOUDINARY_URL`** | Backend: Cloudinary connection string | `cloudinary://api_key:api_secret@cloud_name` *(for image uploads)* |
| **`VITE_API_URL`** | Frontend: REST API target | `http://localhost:8080/api` *(local)* |

> The Docker stack reads its values from `docker/.env.docker` (git-ignored). Copy the values you
> actually want the containers to run with into that file — in particular `CLOUDINARY_URL`, which must
> be populated or the `/users` endpoints 500 until it is.

---

## 5. Quick Start & Setup Instructions

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (v20+ recommended) and `npm`
- [Composer](https://getcomposer.org/) (for host-side backend tools, optional)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/SanTin-Developer/Inventory-Management-System.git
```

### 2. Configure Environment Files
```bash
# Backend configuration (.env lives outside the container build; docker/.env.docker drives runtime)
cp .env.example .env

# Frontend configuration
cd ../inventory-management-frontend
cp .env.example .env          # set VITE_API_URL=http://localhost:8080/api
```

### 3. Launch Docker Services
```bash
# Build and run the backend, database, redis, queue worker, scheduler, and nginx
docker compose up -d --build

# Verify container health
docker compose ps
```

### 4. Initialize Database & Seed Demo Data
The entrypoint runs `php artisan migrate --force` automatically on startup. To generate keys or seed:

```bash
# Generate application encryption key
docker compose exec app php artisan key:generate

# (Optional) Re-seed demo data — creates the Admin account
docker compose exec app php artisan db:seed
```

### 5. Launch the Frontend Console
```bash
cd inventory-management-frontend
npm install
npm run dev
```

Visit:
- **Admin Console**: [http://localhost:5173](http://localhost:5173)
- **Backend API Gateway**: [http://localhost:8080/api](http://localhost:8080/api)

---

## 6. Seeded Demo Account

The `DatabaseSeeder` provisions the following pre-configured credential:

| Role | Email | Password | Allowed Access |
| --- | --- | --- | --- |
| **Administrator** | `admin@yourcompany.com` | `ChangeMe123!` | Full system authority; users, roles, products, purchases, sales, reports, settings. |

> [!WARNING]
> **SECURITY WARNING: This seeded credential is for local development and demonstration testing ONLY.
> All default passwords, test credentials, and demo accounts MUST be changed or removed immediately
> before any staging or production deployment.**

---

## 7. Role-Based Access Control

The system enforces **11 roles**, each with a per-resource access level (`full` / `view` / `none`) defined
in `config/permissions.php` and enforced by the `CheckPermission` middleware on every route group:

| Role | Notes |
| --- | --- |
| **Admin** | Full access to every resource; manages users, roles, and salary ranges. |
| **Manager** | Full access on product/sales/purchase operations; view-only on users and departments. |
| **Accountant** | Full on purchases, sales, commissions, reports; view-only on products, suppliers, customers. |
| **Auditor** | View access across all operational resources; full audit-log reading. |
| **Warehouse Supervisor** | Full on products, categories, suppliers, purchases; stock-history, reports, recommendations. |
| **Cashier** | Full on sales and customers; view-only on products/suppliers. |
| **Staff** | Full on products/sales/purchases; stock-history access. |
| **HR Officer** | Full on departments and users; view-only on roles. |
| **IT Support** | Full on users; view on departments/roles; audit-log access. |
| **Delivery Driver** | View on sales/customers (own deliveries only). |
| **Viewer** | Read-only visibility of reports, analytics, and the dashboard. |

---

## 8. Implementation Status Matrix

| Module / Capability | Implementation Status | Notes |
| --- | --- | --- |
| **Authentication & Profile** | **Implemented** | Sanctum bearer tokens, forgot/reset password, `GET /user` profile, Cloudinary avatar upload. |
| **Two-Factor Authentication** | **Implemented** | Google2FA setup/confirm/disable/verify plus TOTP device verification. |
| **Role-Based Access Control** | **Implemented** | 11 roles, per-resource `full/view/none` matrix, route middleware enforcement, salary-range management. |
| **Catalog & Inventory** | **Implemented** | Products CRUD + stats, categories, suppliers, stock histories with movement tracking. |
| **Purchasing** | **Implemented** | Purchase orders CRUD + stats, per-line product/quantity/price, stock auto-adjustment. |
| **Sales & Customers** | **Implemented** | Sales CRUD + stats, line-item revenue, customer ledger, commission calculation per seller. |
| **Dashboard & Low Stock** | **Implemented** | KPI stats, low-stock alerts endpoint, recent activity feed. |
| **Reports & Analytics** | **Implemented** | Sales/purchase summaries, inventory valuation, top products, slow-moving products, buy-vs-sale analytics. |
| **Recommendations** | **Implemented** | Purchase recommendation engine (per-product and global). |
| **Commissions** | **Implemented** | Per-sale calculation, per-seller history, summary dashboard. |
| **Audit Logs** | **Implemented** | Every mutation recorded via the `Auditable` model concern; searchable log index. |
| **2FA / Email Change** | **Implemented** | Password-confirmed email change with tokenized confirmation link. |
| **Live External Payments** | **Not Applicable** | No external gateway; all payments are recorded/validated internally. |
| **Customer-Facing Booking** | **Not Applicable** | This system is a back-office inventory tool, not a guest-facing site. |

---

## 9. Testing & Quality Assurance

- **PHPUnit Feature Suites**: `AuthTest` (login, 2FA, profile), `ProductApiTest`, `PurchaseApiTest`, and
  `SaleApiTest` covering the core authenticated flows, permission gating, and CRUD behaviour.
- **Rate Limiting**: Public auth endpoints are throttled (`throttle:5,1`) to slow brute force; the
  authenticated API is capped at **60 requests/minute/user** (`RateLimiter::for('api')`).
- **Frontend Lint**: `oxlint` runs clean (`npm run lint`).
- **Build Gate**: `vite build` passes; the SPA serves correctly including deep links.

Run the backend suite with:
```bash
docker compose exec app php artisan test
```

---

## 10. API Overview

All routes are prefixed with `/api` and, except for login/2FA/settings, require a `Bearer` Sanctum token.

| Area | Endpoints |
| --- | --- |
| **Auth** | `POST /login`, `POST /forgot-password`, `POST /reset-password`, `POST /logout`, `GET /user`, `GET /my-permissions` |
| **2FA** | `POST /2fa/setup`, `POST /2fa/confirm`, `POST /2fa/disable`, `POST /2fa/verify` |
| **Dashboard** | `GET /dashboard`, `GET /dashboard/low-stock` |
| **Products** | `GET /products/stats`, `GET /products/all`, `apiResource('products')` (index/show/store/update/destroy) |
| **Categories / Suppliers / Customers / Departments / Roles** | Standard `apiResource(...)` + `all` helper routes |
| **Purchases / Sales** | `apiResource(...)` + `GET .../stats` |
| **Users** | `apiResource('users')` + `GET /users/stats`, `POST /users/{user}/verify-password` |
| **Stock History** | `GET /stock-histories`, `GET /stock-histories/{id}`, `GET /stock-histories/stats` |
| **Reports** | `GET /reports/sales-summary`, `purchase-summary`, `inventory`, `top-products`, `slow-moving` |
| **Recommendations** | `GET /recommendations`, `GET /products/{id}/recommendation` |
| **Commissions** | `POST /sales/{id}/commission`, `GET /users/{id}/commissions`, `GET /commissions/summary` |
| **Audit Logs** | `GET /audit-logs`, `GET /audit-logs/{id}` |
| **Settings** | `GET /settings/{key}`, `PUT /settings/{key}` |
| **Search** | `GET /search` |
| **Email Change** | `POST /email/request-change`, `GET /email/confirm/{token}` |

---

## 11. License

# Copyright (c) 2026 SanTin. All Rights Reserved.

This project, including its Source Code, Design, Documentation, Assets, and all related materials, is the intellectual property of **SanTin**.

You may view and study this project for educational and personal learning purposes.

### ⚠️ Copyright & Usage Notice

**A real developer respects another developer's work. Please respect the time, effort, and creativity invested in creating this project. Do not copy, re-upload, redistribute, or claim this project as your own without my permission.**

Without prior written permission from **SanTin**, you may NOT:

* ❌ Copy the Source Code or substantial portions of this project.
* ❌ Re-upload or redistribute this project or substantial portions of it.
* ❌ Publish this project as your own work.
* ❌ Claim authorship or ownership of this project.
* ❌ Use substantial portions of the code in another project.
* ❌ Sell or use this project for commercial purposes.
* ❌ Remove or modify the Copyright Notice or Attribution.
* ❌ Submit this project as your own academic, professional, or personal work.

If you wish to use, modify, redistribute, or use substantial portions of this project, you must obtain prior permission from **SanTin**.

Any unauthorized use, copying, redistribution, re-uploading, or misrepresentation of this project is strictly prohibited.

Copyright (c) 2026 **SanTin**. All Rights Reserved.
