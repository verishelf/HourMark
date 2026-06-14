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
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (no quotes) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase **anon** key (not service role; no quotes) |
| `NEXT_PUBLIC_SITE_URL` | `https://marketplace.crownly.art` |

After changing env vars, **redeploy** — Next.js bakes `NEXT_PUBLIC_*` into the client bundle at build time.

## Local dev

The marketplace loads env vars from the **repo root** `.env` (same `EXPO_PUBLIC_SUPABASE_*` keys as the iOS app). Restart the dev server after changing env.

Optional: create `marketplace/.env.local` to override:

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

Runs at http://localhost:3001
