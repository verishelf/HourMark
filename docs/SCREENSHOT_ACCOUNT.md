# App Store screenshot account bypass

Account: **frankposada4@icloud.com**

This account can list watches with normal listing photos only — no serial/movement/video verification uploads. Listings are auto-approved as `auto_verified` and appear on Home/Search.

## Apply in Supabase (required once)

Run the migration:

```bash
supabase db push
```

Or paste `supabase/migrations/20260531100000_bypass_listing_auth.sql` into the SQL Editor.

Deploy the updated edge function:

```bash
supabase functions deploy analyze-listing
```

## What it sets

| Field | Value |
|-------|--------|
| `verified` | `true` |
| `is_verified_seller` | `true` |
| `kyc_status` | `approved` |
| `bypass_listing_auth` | `true` |
| Existing listings | `auto_verified` + `active` |

## In the app

1. Sign in as **frankposada4@icloud.com**
2. **Sell** → add photos + details → publish (skips AI upload step)
3. Listings show on Home/Search for screenshots

## Remove bypass later

```sql
update public.users u
set bypass_listing_auth = false
from auth.users au
where u.id = au.id and lower(au.email) = lower('frankposada4@icloud.com');
```
