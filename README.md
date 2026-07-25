# Alihub

**B2B sourcing for Nepal.** Browse Alibaba's global catalog, see the landed price in Nepali Rupees (NPR) up front, and shortlist products to source.

The storefront ([`apps/web`](apps/web)) is a **standalone Next.js app** that talks to the Alibaba Open Platform **directly** (server-side) and computes NPR landed-cost pricing in-app — there is no separate backend service.

> The other workspace folders (`apps/admin`, `apps/mobile`, `packages/*`) belonged to a previous full-stack architecture that has been removed. Only `apps/web` is maintained and deployable.

---

## How it works

- **Catalog** — live keyword search and product detail come straight from Alibaba's buyer sourcing API (`/eco/buyer/product/*`). Nothing is persisted; every request hits Alibaba.
- **Pricing** — each USD price is converted to a landed NPR price (FX + freight + customs + margin + VAT). See [`apps/web/lib/pricing.ts`](apps/web/lib/pricing.ts). Rates are env-configurable.
- **Home** — an Alibaba-style layout: header search, a category rail, and curated product feeds (cached via ISR so they don't hit the live API on every request).
- **Cart** — a device-local shortlist (localStorage). Ordering/payment is handled offline by the Alihub team.

### Request signing
Alibaba calls are HMAC-SHA256 signed **server-side only** ([`apps/web/lib/alibaba/client.ts`](apps/web/lib/alibaba/client.ts)) — the app key/secret and access token never reach the browser.

---

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · lucide-react · sanitize-html

---

## Local development

```bash
pnpm install
cd apps/web
# create .env.local with the variables below, then:
pnpm dev            # http://localhost:3000
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
  app/                    # routes: home, /products/[slug], /cart
  components/
    ui/                   # Button, Card, Input, Badge, icons, …
    commerce/             # HeroBand, ProductCard, ProductRail, PriceTierTable, …
  lib/
    alibaba/              # signed client + response mappers
    pricing.ts            # USD → NPR landed cost
    api.ts                # searchProducts() / getProduct()
```
