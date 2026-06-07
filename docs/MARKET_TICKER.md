# Market ticker (home marquee)

The home **Live** ticker pulls real prices from Crownly marketplace data, with optional [WatchCharts](https://watchcharts.com/api) enrichment.

## Data sources (priority)

1. **Crownly listings** — median ask price for tracked references on active, verified listings
2. **Crownly sales** — completed order amounts (30-day vs prior 30-day for % change)
3. **Live inventory** — top active Crownly listings not already in the benchmark list
4. **WatchCharts** (optional) — market price + 1Y history when `WATCHCHARTS_API_KEY` is set and Crownly has no data for a reference
5. **Fallback** — static offline values only if the API is unreachable

## Deploy the edge function

```bash
supabase functions deploy market-ticker
```

Public GET endpoint (no auth required):

```
https://YOUR_PROJECT.supabase.co/functions/v1/market-ticker
```

The app calls this via `EXPO_PUBLIC_API_URL` or `${EXPO_PUBLIC_SUPABASE_URL}/functions/v1`.

## Optional: WatchCharts API

WatchCharts requires a Professional + API subscription (~$5k/yr) and a **distribution license** to show data in a consumer app. If you have access:

```bash
supabase secrets set WATCHCHARTS_API_KEY=your_key_here
```

Redeploy `market-ticker` after setting the secret.

## Tracked references

Edit `constants/marketTicker.ts` and mirror benchmarks in `supabase/functions/_shared/marketTicker.ts` (keep both in sync when adding references).

## % change logic

- **Sales:** average completed sale price last 30 days vs 31–60 days ago
- **Listings only:** median listing price for recent vs prior 30-day cohorts
- **WatchCharts:** 1-year price history (latest vs earliest point)

When insufficient history exists, change shows as `0.0%`.
