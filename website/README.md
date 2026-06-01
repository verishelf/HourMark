# Crownly Website

Marketing site for the Crownly luxury watch marketplace iOS app. Built with Next.js 16, TypeScript, Tailwind CSS, and Framer Motion.

## Legal pages

| Page | Path |
|------|------|
| Privacy Policy | `/privacy` |
| Terms of Service & EULA | `/terms` (EULA anchor: `/terms#eula`) |

Update contact emails and effective date in `src/lib/legal.ts` before production launch.

## Brand assets

| Asset | Path | Notes |
|-------|------|--------|
| Website logo (transparent) | `public/crownly-logo.png` | Same transparent master as the mobile app UI |
| Favicon / Apple touch | `public/favicon.png`, `public/apple-touch-icon.png` | Generated from transparent master |

The **App Store icon** (`/assets/icon.png` in the Expo app) uses the dark-background artwork only; see `/assets/README.md`.

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

### Custom domain (`crownly.art`)

Production URL is configured in `src/lib/legal.ts` as `https://crownly.art` (SEO, sitemap, Open Graph, and `llms.txt`).

1. In Vercel → **Project → Settings → Domains**, add `crownly.art` and `www.crownly.art`.
2. At your registrar, set DNS per Vercel’s instructions (usually `A` / `CNAME` to Vercel).
3. Set up email forwarding for `hello@`, `privacy@`, and `legal@crownly.art` if you use those addresses.
4. After deploy, submit `https://crownly.art/sitemap.xml` in [Google Search Console](https://search.google.com/search-console).

## Design

Matches the mobile app aesthetic:

- Background `#000000`
- Card `#0A0A0A`
- Border `#1A1A1A`
- Editorial typography and minimal luxury layout
