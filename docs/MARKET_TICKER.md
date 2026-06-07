# Recent sales ticker (home marquee)

The home **Sold** bar shows recently completed Crownly sales with a circular watch photo, brand/model, and sale price.

## Data sources

1. **Completed orders** — `orders.status = 'completed'`, joined to listing images
2. **Sold listings** — `listings.status = 'sold'` when there are not enough completed orders yet

No third-party market APIs are used.

## Deploy

```bash
supabase functions deploy market-ticker
```

Public GET:

```
https://YOUR_PROJECT.supabase.co/functions/v1/market-ticker
```

Response shape:

```json
{
  "items": [
    {
      "id": "order-uuid",
      "listingId": "listing-uuid",
      "brand": "Rolex",
      "model": "Submariner",
      "reference": "126610LN",
      "price": 14200,
      "imageUrl": "https://.../listing-images/...",
      "soldAt": "2026-06-07T..."
    }
  ],
  "updatedAt": "..."
}
```

The app caches results for 10 minutes on device; the edge function caches for 10 minutes server-side.

## Tap behavior

Each chip opens the listing detail screen for that watch.
