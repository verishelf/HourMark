# HourMark Trust & Authentication System

## Deploy

1. Run migration in Supabase SQL editor:

   `supabase/migrations/20260529000000_trust_authentication_system.sql`

2. Deploy Edge Functions:

   - `analyze-listing`
   - `submit-kyc`
   - `kyc-webhook`
   - `confirm-delivery`
   - `release-escrow`
   - `update-order-shipping`

3. Set secrets:

   | Secret | Purpose |
   |--------|---------|
   | `PERSONA_API_KEY` | Persona KYC (optional) |
   | `ONFIDO_API_KEY` | Onfido KYC (optional) |
   | `KYC_DEV_AUTO_APPROVE=true` | Dev: auto-approve KYC |
   | `STRIPE_WEBHOOK_SECRET` | Payment + escrow events |

4. Point Persona/Onfido webhooks to `kyc-webhook`.

5. Schedule `release-escrow` (cron) for orders past `inspection_ends_at`.

## App flows

- **Sell** → draft listing → `/listing/trust-verify/[id]` → AI analysis → live when `auto_verified`
- **KYC** → `/kyc` → ID + selfie + phone → Verified Seller badge
- **Checkout** → manual capture escrow → `/order/[id]` tracking & release

## Storage buckets (private)

`kyc-documents`, `watch-serials`, `movement-images`, `watch-videos`, `watch-box-images`
