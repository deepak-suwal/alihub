# Alihub

**B2B sourcing for Nepal.** Browse Alibaba's global catalog, see the landed price in Nepali Rupees (NPR) up front, and shortlist products to source.

The storefront ([`apps/web`](apps/web)) is a **standalone Next.js app** that talks to the Alibaba Open Platform **directly** (server-side) and computes NPR landed-cost pricing in-app — there is no separate backend service.

> The other workspace folders (`apps/admin`, `apps/mobile`, `packages/*`) belonged to a previous full-stack architecture that has been removed. Only `apps/web` is maintained and deployable.

---

## How it works

- **Catalog** — live keyword search and product detail come straight from Alibaba's buyer sourcing API (`/eco/buyer/product/*`). Nothing is persisted; every request hits Alibaba.
- **Pricing** — each USD price is converted to a landed NPR price (FX + freight + customs + margin + VAT). See [`apps/web/lib/pricing.ts`](apps/web/lib/pricing.ts). Rates are env-configurable.
- **Home** — an Alibaba-style layout: header search, a category rail, and curated product feeds (cached via ISR so they don't hit the live API on every request).
- **Cart** — a device-local shortlist (localStorage), holding product ids and quantities only — never prices.
- **Checkout** — the cart is re-priced server-side, an order is created, and the customer pays with **eSewa** or **Khalti**.

### Request signing
Alibaba calls are HMAC-SHA256 signed **server-side only** ([`apps/web/lib/alibaba/client.ts`](apps/web/lib/alibaba/client.ts)) — the app key/secret and access token never reach the browser.

---

## Checkout & payments

```
/checkout ──▶ POST /api/quote        re-prices the cart from live Alibaba data
          ──▶ POST /api/checkout     creates the order, initiates payment
                                     ├─ eSewa  → signed form POST (auto-submitted)
                                     └─ Khalti → redirect to the hosted payment page
          ◀── /api/payments/{provider}/callback/{reference}
                                     verifies against the gateway's own status API
          ──▶ /orders/{id}           order status
```

**The browser never supplies a price.** The cart carries product ids and quantities; every amount
charged is recomputed by [`lib/quote.ts`](apps/web/lib/quote.ts) at checkout time, so a tampered
payload can change what is ordered but not what it costs.

**A redirect is never proof of payment.** Both providers ignore the status carried back in the
return URL and confirm against the gateway server-to-server — eSewa's transaction-status API and
Khalti's `lookup` — before an order can become `PAID`. The confirmed amount must match the order
total to the paisa.

**Payments apply at most once.** Concurrent or replayed callbacks contend for a single-use claim in
the order store, and `PAID` is only reachable from `PENDING_PAYMENT`. A failed attempt leaves the
order payable, and each retry allocates a fresh gateway reference (eSewa rejects a reused
`transaction_uuid`).

Adding a provider — ConnectIPS, Fonepay — means implementing `PaymentProvider`
([`lib/payments/types.ts`](apps/web/lib/payments/types.ts)) and adding a row to the registry.

### Order storage
Checkout needs a server-side record of what was quoted. Set `UPSTASH_REDIS_REST_URL` /
`UPSTASH_REDIS_REST_TOKEN` for a Redis-backed store (plain REST, no driver dependency). Without
them the store falls back to per-instance memory: fine for `next dev`, but each serverless instance
gets its own copy, so **checkout refuses to run in production** rather than take unreconcilable
money.

---

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · lucide-react · sanitize-html

---

## Local development

```bash
pnpm install
cd apps/web
# create .env.local with the variables below, then:
pnpm run dev            # http://localhost:3000
```

> `apps/web` is fully self-contained — it does not depend on the other workspace packages.

---

## Environment variables

Set these in `apps/web/.env.local` (local) and in your host's env (Vercel). They are **required** — without them the live catalog won't load.

| Variable | Description | Example |
| --- | --- | --- |
| `ALIBABA_API_BASE_URL` | Alibaba GOP gateway | `https://openapi-api.alibaba.com/rest` |
| `ALIBABA_APP_KEY` | Open Platform app key | `502250` |
| `ALIBABA_APP_SECRET` | App secret (**server-only**) | `••••••••` |
| `ALIBABA_ACCESS_TOKEN` | OAuth access token | `••••••••` |
| `ALIBABA_REFRESH_TOKEN` | OAuth refresh token | `••••••••` |
| `USD_NPR_RATE` | USD → NPR FX rate | `133.50` |
| `FREIGHT_NPR_PER_UNIT` | Freight estimate per unit (NPR) | `150` |
| `CUSTOMS_DUTY_PERCENT` | Customs duty | `15` |
| `MARGIN_PERCENT` | Platform margin | `18` |
| `VAT_RATE` | Nepal VAT (fraction) | `0.13` |

### Checkout & payments

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public origin — gateway return URLs are built from it | `https://alihub.com.np` |
| `UPSTASH_REDIS_REST_URL` | Order store (required in production) | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Order store token | `••••••••` |
| `ESEWA_MODE` | `uat` (default) or `live` | `live` |
| `ESEWA_PRODUCT_CODE` | Merchant code; defaults to `EPAYTEST` in UAT | `NP-ES-ALIHUB` |
| `ESEWA_SECRET_KEY` | Merchant secret; defaults to the public UAT key in UAT | `••••••••` |
| `KHALTI_MODE` | `sandbox` (default) or `live` | `live` |
| `KHALTI_SECRET_KEY` | Live/sandbox secret key — **unset hides Khalti at checkout** | `••••••••` |

> With no `ESEWA_*` set the app runs against eSewa's public sandbox, so checkout is testable out of
> the box. Set `ESEWA_MODE=live` **and** real credentials before taking real money — live mode with
> missing credentials disables the provider rather than falling back to the test key.

> **Access token validity:** the current token is valid until **Jan 2027**. Automatic refresh is not yet implemented — add it before then.

---

## Deploy to Vercel

Import `deepak-suwal/alihub` at [vercel.com/new](https://vercel.com/new) and set:

- **Root Directory:** `apps/web`  ← required (isolates the app from the other workspace folders)
- **Framework:** Next.js (auto-detected)
- **Environment Variables:** add all of the above

Or via CLI:

```bash
cd apps/web
vercel login
vercel                 # link + preview deploy
./push-vercel-env.sh   # push env vars from .env.local to the linked project
vercel --prod
```

Every push to `main` auto-deploys once the project is linked.

---

## Project layout

```
apps/web/
  app/                    # routes: home, /products/[slug], /cart, /checkout, /orders/[id]
    api/
      quote/              # POST — re-price a cart
      checkout/           # POST — create order + initiate payment
      orders/[id]/refresh # POST — re-ask the gateway about an unsettled order
      payments/[provider]/callback/[reference]/
  components/
    ui/                   # Button, Card, Input, Badge, icons, …
    commerce/             # HeroBand, ProductCard, ProductRail, PriceTierTable, …
  lib/
    alibaba/              # signed client + response mappers
    payments/             # PaymentProvider abstraction + eSewa, Khalti
    orders/               # order types, pluggable store, lifecycle service
    pricing.ts            # USD → NPR landed cost
    quote.ts              # server-side cart re-pricing (authoritative amounts)
    api.ts                # searchProducts() / getProduct()
```
