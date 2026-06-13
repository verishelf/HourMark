# Crownly 1.1.0 — Build & release checklist

**Marketing version:** `1.1.0`  
**iOS build number:** EAS auto-increment (seed `2` in `app.json`)  
**Android versionCode:** `2`

---

## What's new (App Store / TestFlight notes)

Copy for **What's New in This Version**:

```
• List watches as timed auctions with live countdown timers and bidding
• Redesigned home discovery tabs: Best Sellers, Low Price, New Arrivals, Rare Finds
• Live Auctions tab with bid placement on listing detail
• Sell flow: choose Fixed Price or Auction with duration and optional reserve
• Bug fixes and performance improvements
```

---

## Backend before mobile build

1. **Apply Supabase migrations** (includes listing auctions):

   ```bash
   supabase db push
   ```

   New migration: `20260612120000_listing_auctions.sql`

2. **Deploy Edge Functions** (if changed since last release):

   ```bash
   supabase functions deploy
   ```

3. Confirm production Stripe + Supabase secrets on EAS:

   ```bash
   npx eas-cli secret:list
   ```

---

## Build commands

**Production (App Store):**

```bash
npm run eas:build:ios
```

**Internal preview (device test):**

```bash
npm run eas:build:ios:preview
```

**Submit after a green production build:**

```bash
npm run eas:submit:ios
```

---

## Pre-submit QA

- [ ] Sign in with Apple on a **production/preview** build (not Expo Go)
- [ ] Create fixed-price listing end-to-end (photos → verify → live)
- [ ] Create auction listing; confirm timer starts when listing goes active
- [ ] Place a bid on a live auction; confirm countdown and current bid update
- [ ] Home tabs: Auctions, Best Sellers, Low Price, New Arrivals, Rare Finds load listings
- [ ] Checkout / Stripe payment on a fixed-price listing
- [ ] Push notifications (if enabled in this build)

---

## Version bump reference

| Field | File |
|-------|------|
| `expo.version` | `app.json` |
| `ios.buildNumber` | `app.json` (EAS increments on production) |
| `android.versionCode` | `app.json` |
| `package.json` version | Keep in sync with `expo.version` |

See also [IOS_APP_STORE.md](./IOS_APP_STORE.md).
