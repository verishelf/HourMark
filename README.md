# HourMark

Luxury watch marketplace — Expo React Native iOS app + Next.js marketing site in one repo.

## Project structure

```
HourMark/                 ← repo root (Expo app)
├── app/                  ← mobile screens (Expo Router)
├── components/
├── website/              ← Next.js marketing site
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── package.json          ← Expo app dependencies
└── ...
```

## Mobile app (Expo)

```bash
npm install
cp .env.example .env
npm start
```

## Website (Next.js)

From the **repo root**:

```bash
npm run website:install   # first time
npm run website:dev       # http://localhost:3000
```

Or from `website/`:

```bash
cd website
npm install
npm run dev
```

### Deploy on Vercel

| Setting | Value |
|---------|--------|
| Repository | `https://github.com/verishelf/HourMark` |
| **Root Directory** | `website` |
| Framework | Next.js |

## Features

- Discover, Search, Sell, Messages, Profile
- Stripe Connect Express onboarding + destination charges (3% platform fee)
- Supabase auth, database, realtime chat
- Demo mode without backend keys

## Stripe Connect API

Production backend lives in `apps/api/`:

```bash
npm run api:install
cd apps/api && cp .env.example .env
npm run api:dev   # http://localhost:3001
```

Set `EXPO_PUBLIC_API_URL` in the Expo `.env` to your API URL.

Run `supabase/schema.sql` then `supabase/migrations/20250527000000_stripe_connect.sql` in the Supabase SQL editor.

See [apps/api/README.md](apps/api/README.md) for webhook setup and endpoints.

## License

MIT
