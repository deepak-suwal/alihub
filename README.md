# Alihub

Nepal B2B sourcing platform — Alibaba catalog, ConnectIPS/Fonepay settlement.
Full architecture and rationale: see the published blueprint (14-section
technical spec covering pricing engine, settlement ledger, compliance, and
the 90-day roadmap this repo is Phase 1 of).

## Structure

```
apps/api             NestJS backend (auth, catalog sync, pricing, payments, orders, admin)
apps/web              Next.js storefront (SSR browse/PDP, cookie-session auth, checkout)
apps/admin            Next.js admin panel (orders, refunds, price overrides, sync jobs)
apps/mobile           Flutter app (BLoC + clean architecture; browse, cart, checkout, orders)
packages/config       Zod-validated environment schema, shared across services
packages/prisma       Prisma schema + generated client (the money/catalog ledger)
```

## Local setup

```bash
corepack pnpm install
cp .env.example .env        # fill in real secrets before anything but local dev
docker compose -f docker-compose.dev.yml up -d   # Postgres on :5433, Redis on :6380
docker exec alihub-postgres-1 psql -U alihub -d alihub -c "CREATE DATABASE alihub_shadow;"
corepack pnpm prisma:migrate
corepack pnpm dev:api                          # http://localhost:4000
corepack pnpm --filter @alihub/web dev          # http://localhost:3000
corepack pnpm --filter @alihub/admin dev        # http://localhost:3003
```

Health checks: `GET /healthz` (liveness), `GET /readyz` (DB + Redis reachable).

Note: ports 3001/3002 were already taken by other local processes on this
machine when this was built, so `@alihub/admin` defaults to **3003** —
change it in `apps/admin/package.json` if that's inconvenient.

### Storefront auth model

`apps/web` never sees the JWT directly — `/api/auth/{login,register,logout}`
are Next.js Route Handlers that call the backend and set the access/refresh
tokens as `httpOnly` cookies. Server Components (`/orders`,
`/checkout/result`) read the cookie server-side and call the API directly;
the cart is client-only (`localStorage`) since there's no persisted Cart
entity in the MVP schema — checkout sends the cart items straight to
`POST /orders/checkout`. ConnectIPS needs a real browser form POST (not
`fetch`), so `/checkout` renders and auto-submits a hidden form when the
API returns a `formPost` payload instead of a redirect URL.

### Admin panel

Same cookie-session pattern as the storefront, plus a staff-role check:
`/api/auth/login` decodes the issued JWT's `role` claim and rejects the
login (403) if it isn't `SUPPORT`/`FINANCE`/`ADMIN`/`SUPER_ADMIN` — that
decode is for UI purposes only (which nav/actions to show), never the
actual authorization boundary, which is always the backend's `RolesGuard`
on every `/admin/*` call (see `lib/session.ts`). Mutations (order
transitions, refund request/approve, price override set/clear) are Next.js
Server Actions rather than Route Handlers — same `apiFetch` + cookie
pattern, less boilerplate for a panel that's mostly forms. Refund approval
enforces dual control in the UI too: the "Approve" button disables itself
if you're the one who requested that refund, mirroring the backend check.

To promote a user to staff for local testing (no bootstrap UI exists yet):

```bash
node -e "require('@prisma/client')" # sanity check the client is generated
# then, from apps/api with DATABASE_URL loaded:
node -e "new (require('@prisma/client').PrismaClient)().user.update({where:{email:'you@example.com'},data:{role:'ADMIN'}}).then(()=>process.exit())"
```

### Mobile app (apps/mobile)

Flutter with **BLoC + clean architecture**: each feature (`auth`, `catalog`,
`cart`, `orders`) has `domain/` (entities, repository interfaces, one class
per use case — JSON-free), `data/` (Dio data sources, JSON models extending
the entities, repository impls translating `DioException` → `Failure`), and
`presentation/` (blocs/cubits + pages). Dependencies point inward only;
`lib/app/injection.dart` (get_it) is the composition root, and
`lib/core/error/failure.dart` defines the `Result<T> = Ok | Err` type
repositories return so blocs never see raw exceptions.

App-scoped blocs (AuthBloc, CartCubit, CatalogBloc) are provided in
`main.dart`; screen-scoped ones (ProductDetailBloc, CheckoutCubit,
OrdersBloc) are created per-route in `lib/app/router.dart` so their state
dies with the screen. Tokens live in the platform keychain
(`flutter_secure_storage`) with a one-shot refresh-and-retry interceptor
on 401 — same session semantics as the web apps' httpOnly cookies.

```bash
cd apps/mobile
flutter pub get
flutter run --dart-define=API_URL=http://localhost:4000   # iOS simulator
flutter run --dart-define=API_URL=http://10.0.2.2:4000    # Android emulator
flutter test    # 14 bloc/cubit tests (auth, catalog, cart)
```

Known gaps for production: the `alihub://checkout/result` deep-link scheme
isn't registered in iOS/Android config yet, and ConnectIPS's form-POST flow
needs a WebView screen (until then it's best completed on the web
storefront — the checkout page says so).

## What's real vs. what needs your credentials

- **Alibaba Open Platform** (`apps/api/src/alibaba/`) — **live-verified
  against the real GOP gateway** (`openapi-api.alibaba.com/rest`) with the
  Alihub app credentials: the HMAC-SHA256 request signing passes the
  gateway's validation, and these API paths were confirmed to exist for
  this app (probe date 2026-07-23): `/auth/token/create`,
  `/auth/token/refresh`, `/alibaba/icbu/product/list`,
  `/alibaba/icbu/product/schema/get`, `/alibaba/icbu/product/group/get`,
  `/alibaba/icbu/category/id/mapping`.

  **One manual step remains — OAuth authorization** (needs a browser login
  to your Alibaba account, so only you can do it):
  1. In the App Console, make sure a callback URL is registered for the app.
  2. `GET /admin/alibaba/auth/url?redirectUri=<that callback URL>` and open
     the returned URL in a browser logged into your Alibaba account.
  3. Approve; Alibaba redirects to your callback with `?code=…`.
  4. `POST /admin/alibaba/auth/exchange {"code": "…"}` within ~10 minutes.
  The token (plus refresh token) is persisted in `alibaba_tokens`; sync
  jobs pick it up and auto-refresh it. After that,
  `POST /admin/alibaba/sync/products/search` pulls your real products.

  The `result`-payload field names for `product/list` are mapped
  defensively (`upstream-mapper.ts`) — eyeball the first real response
  against API Explorer's sample and tighten the mapping. No category-tree
  API answered for this app, so unseen category ids get stub rows the
  admin can rename; set `ALIBABA_PATHS.CATEGORY_GET` if API Explorer
  shows one.

### Live catalog mode (no background sync)

The catalog is **real-time**: browse and PDP call Alibaba's
`/alibaba/icbu/product/list` on every request via
`AlibabaLiveCatalogService`; product ids in URLs are the Alibaba product
ids. There is no scheduled sync (the scheduler was removed). Local writes
happen in exactly one place: at **checkout**, `materialize()` re-fetches
the product live from Alibaba (so orders price from Alibaba's current
data), then snapshots product/supplier/category into Postgres because the
order ledger, invoices, and dispute evidence need a point-in-time record.

The **admin panel's catalog list is live too** (`/admin/products` calls
the same Alibaba path, merged with local price-override state), and price
overrides on a not-yet-materialized product materialize it on demand.

Two knobs to know about:
- `ALIBABA_LIVE_CACHE_TTL_SECONDS` (**default 0 = fully real time**;
  every request is a live Alibaba call). If traffic starts queueing
  behind the per-AppKey QPS bucket (~5 req/s), set e.g. 60 to absorb
  bursts with a Redis micro-cache.
- Live items are priced with the **platform-default margin** (blueprint
  §6 fallback); supplier/category-scoped margin rules apply from checkout
  onward, once the product has a local row.

Until the OAuth step above is completed, `/catalog/*` and checkout return
a clear 503 telling you to authorize — that's expected, not a bug.
- **ConnectIPS** — signs via an RSA keypair from a bank-issued PKCS12 (.pfx)
  certificate, not a shared secret. `CONNECTIPS_PFX_PATH` /
  `CONNECTIPS_PFX_PASSPHRASE` are unset by default; `ConnectIpsProvider`
  throws a clear config error until you supply them. Reconfirm the claim
  set and status-check endpoint against the current Merchant Integration
  Guide before production traffic.
- **Fonepay** — DV hash (HMAC-SHA512) and endpoints are reproduced from
  commonly referenced merchant integration samples; reconfirm against your
  current Fonepay guide.
- **Freight/customs** (`apps/api/src/pricing/freight-estimator.ts`) — flat
  placeholder rates. Replace with real freight-forwarder quotes and a
  per-HS-code duty table once the Logistics module exists.

## Tests

```bash
corepack pnpm test
```

23 unit tests cover the pieces where a bug means wrong money or a security
hole: the pricing formula (`compute-price.spec.ts`), the order state
machine, the Alibaba request signer, and the Fonepay DV hash.

## Verified end-to-end

Backend: register → JWT issuance → RBAC-guarded route → refresh rotation →
reuse detection → seeded catalog → checkout → pricing engine (FX + customs
+ VAT + margin) → order + commission persisted → payment initiation
reaching the (unconfigured) Fonepay call → admin RBAC (403 for non-admins)
→ price override flowing through to a Redis-cached catalog page → order
transition + refund dual-control with a full audit trail.

Storefront: `next build` (production build, all routes type-check) →
`next start` against the live API → SSR home/PDP pages rendering real
catalog data → register through the web app's route handler → `httpOnly`
cookies issued → protected `/orders` page accessible → checkout creating
a real priced order in Postgres.

Admin panel: production build → unauthenticated access redirecting to
`/login` → staff login succeeding, non-staff account rejected with 403 →
dashboard/orders/order-detail/products/sync-jobs pages all rendering real
data → missing order returning 404 → logout clearing cookies.

All exercised against real Postgres/Redis, not mocked — but nothing here
was run in an actual browser, since no browser tool is available in this
environment; verification was via `curl` against the rendered HTML/JSON.
The interactive pieces (Server Actions for transitions/refunds/overrides,
cart UI) type-check and build but deserve a manual click-through.
