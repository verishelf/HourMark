# Crownly Marketplace

Chrono24-style browse UI with Crownly dark theme. Deploy as a **separate Vercel project** from the marketing site.

## Vercel setup

1. **New project** → Import `HourMark` from GitHub.
2. **Root Directory:** `marketplace` (required).
3. **Framework Preset:** Next.js (auto-detected).
4. **Install Command:** leave default or set to `npm install` — do **not** use `npm install --prefix website` (that is for `crownly.art` only).
5. **Build Command:** `npm run build`
6. **Output Directory:** leave default (Next.js)

If build still fails, open **Settings → General → Build & Development Settings** and clear any overridden install/build commands copied from the main website project.

## Environment variables

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://marketplace.crownly.art` |

## Local dev

```bash
cp .env.example .env.local
npm install
npm run dev
```

Runs at http://localhost:3001
