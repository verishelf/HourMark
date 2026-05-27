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
- Stripe Connect checkout (3% platform fee)
- Supabase auth, database, realtime chat
- Demo mode without backend keys

## License

MIT
