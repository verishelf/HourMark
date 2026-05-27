# HourMark API

Stripe Connect marketplace backend for HourMark. Handles Express account onboarding, destination charges with a **3% platform commission**, and webhooks that sync Supabase.

## Setup

```bash
cd apps/api
cp .env.example .env
# Fill in STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_* keys
npm install
npm run dev
```

From repo root:

```bash
npm run api:install
npm run api:dev
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (server only) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe Dashboard |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (bypasses RLS for webhooks) |
| `SUPABASE_ANON_KEY` | Anon key (validates user JWTs) |
| `PLATFORM_COMMISSION_RATE` | Default `0.03` (3%) |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/stripe/connect/account` | Create Express Connect account |
| `POST` | `/api/stripe/connect/onboarding-link` | Generate onboarding URL |
| `GET` | `/api/stripe/connect/status` | Onboarding / payout status |
| `POST` | `/api/stripe/payments/create-intent` | Destination charge PaymentIntent |
| `POST` | `/api/stripe/webhooks/stripe` | Stripe webhooks (raw body) |

Legacy paths (Expo app):

- `POST /api/payments/create-intent`
- `POST /api/connect/onboard`

## Stripe Dashboard

1. Enable **Connect** with Express accounts.
2. Add webhook endpoint: `https://your-api.com/api/stripe/webhooks/stripe`
3. Subscribe to: `payment_intent.succeeded`, `payment_intent.payment_failed`, `account.updated`, `charge.refunded`

## Commission example

$10,000 watch → `application_fee_amount` = $300 (3%) → seller receives $9,700 via `transfer_data.destination` (Stripe processing fees apply separately).
