# Crownly Website

Marketing site for the Crownly luxury watch marketplace iOS app. Built with Next.js 16, TypeScript, Tailwind CSS, and Framer Motion.

## Legal pages

| Page | Path |
|------|------|
| Privacy Policy | `/privacy` |
| Terms of Service & EULA | `/terms` (EULA anchor: `/terms#eula`) |

Update contact emails and effective date in `src/lib/legal.ts` before production launch.

## Brand assets

| Asset | Path |
|-------|------|
| Master logo | `public/crownly-logo.png` |
| Favicon / Apple touch | `public/favicon.png`, `public/apple-touch-icon.png` |

Expo app icons and splash use the same mark in `/assets/` (`crownly-logo.png`, `icon.png`, `splash-icon.png`).

Copy and feature highlights align with the mobile app and Stripe Connect marketplace backend (`apps/api/`).

Brand marquee logos are sourced from Wikimedia Commons and committed under `public/logos/brands/`. Regenerate with `npm run logos`.

## Development

```bash
cd website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy

Deploy to [Vercel](https://vercel.com) from the repo root. The root `vercel.json` installs and builds only the `website/` Next.js app.

**Recommended:** In Vercel project settings, set **Root Directory** to `website` and remove custom root-level build overrides if you prefer the default Next.js flow.

## Design

Matches the mobile app aesthetic:

- Background `#000000`
- Card `#0A0A0A`
- Border `#1A1A1A`
- Editorial typography and minimal luxury layout
