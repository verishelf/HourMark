# Crownly Admin Dashboard

Internal admin portal for managing the Crownly luxury watch marketplace. Shares the same Supabase database as the mobile app and marketing website.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS + Shadcn UI
- Supabase Auth & Database
- Recharts
- Resend (email campaigns)
- Vercel

## Getting Started

### 1. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `RESEND_API_KEY` | Resend API key for email campaigns |
| `RESEND_FROM_EMAIL` | Verified sender on your Resend domain (e.g. `hello@marketing.crownly.art`) |
| `RESEND_REPLY_TO_EMAIL` | Optional reply-to inbox (defaults to `hello@crownly.art`) |
| `NEXT_PUBLIC_APP_URL` | Dashboard URL (for email tracking) |

### 2. Database Migration

Run the admin dashboard migration from the repo root:

```bash
supabase db push
# or apply: supabase/migrations/20260605120000_admin_dashboard.sql
```

### 3. Create an Admin User

Grant admin access to a user in Supabase SQL editor:

```sql
UPDATE public.users
SET admin_role = 'super_admin'
WHERE id = '<your-user-uuid>';
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Admin Roles

| Role | Access |
|------|--------|
| `super_admin` | Full access to all features |
| `support_admin` | Users, leads, support, campaigns |
| `auth_inspector` | Listings, authentication |
| `finance_admin` | Transactions, revenue, audit logs |

## Features

- **Dashboard** — KPIs and charts (revenue, listings, users, sales, auth volume)
- **Listings** — Approve, reject, feature, filter by brand/status
- **Users** — Suspend, verify, change roles, send email
- **Seller Leads** — CRM with status pipeline and notes
- **Email Campaigns** — Create, schedule, send via Resend with open/click tracking
- **Authentication** — Track watch auth requests end-to-end
- **Transactions** — Release funds, refund, export
- **Revenue** — Gross volume, Crownly revenue, brand/seller breakdowns
- **Support** — Ticket management with replies and assignment
- **Notifications** — Real-time admin event feed
- **Analytics** — Conversion, retention, auth success rates
- **Audit Logs** — Immutable admin action history
- **Settings** — Commission, fees, email templates, auth rules

## Deploy to Vercel

```bash
vercel --cwd dashboard
```

Set all environment variables in the Vercel project settings.
