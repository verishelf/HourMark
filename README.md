# HourMark

A production-ready luxury watch marketplace built with Expo React Native. Inspired by Bezel, Chrono24, and premium editorial commerce.

## Repository

| Directory | Description |
|-----------|-------------|
| `/` | Expo React Native iOS app |
| [`website/`](./website/) | Next.js marketing site |

## Mobile App

### Features

- **Discover** — Editorial hero carousel, featured watches, new arrivals, verified sellers
- **Search** — Real-time search, brand filters, price ranges, condition filters
- **Sell** — Multi-photo uploads, full listing form, preview & publish
- **Messaging** — Real-time buyer/seller chat with read receipts
- **Checkout** — Stripe Connect payments with 3% platform commission, Apple Pay
- **Profile** — Listings, favorites, orders, payout settings, identity verification

### Getting Started

```bash
npm install
cp .env.example .env
npm start
```

See [`.env.example`](./.env.example) and [`supabase/schema.sql`](./supabase/schema.sql) for backend setup.

## Marketing Website

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the HourMark showcase site.

## Tech Stack

- Expo SDK 56 · React Native · TypeScript · Expo Router · NativeWind
- Supabase · Stripe Connect · Reanimated · Moti · FlashList
- **Website:** Next.js 16 · Tailwind CSS · Framer Motion

## License

MIT
