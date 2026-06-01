# Firebase Analytics (iOS)

Crownly uses **React Native Firebase** for native Analytics. Config file: `GoogleService-Info.plist` at the project root.

## Requirements

- **Does not work in Expo Go** — use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) or EAS build.
- Firebase project **crownly** with iOS app `com.crownly.app` (must match `app.json`).

## Enable Analytics in Firebase Console

1. [Firebase Console](https://console.firebase.google.com/) → project **crownly**
2. **Analytics** → enable Google Analytics if prompted
3. Confirm the iOS app is registered with bundle ID `com.crownly.app`

The plist may show `IS_ANALYTICS_ENABLED` as false; the SDK still collects events once Analytics is enabled in the console.

## Build & run

```bash
# Development build (simulator or device)
eas build --profile development --platform ios

# Or local native run after prebuild
npx expo prebuild --platform ios
npx expo run:ios
```

After installing the dev build, start Metro with `npx expo start --dev-client`.

## What we track

- **Screen views** — automatic on navigation (`screen_view` via `logScreenView`)
- **User ID** — set when signed in (Supabase user id), cleared on sign out

Custom events from app code:

```ts
import { logAnalyticsEvent } from "@/lib/analytics";

await logAnalyticsEvent("listing_view", { listing_id: id });
```

## Android (optional)

Add `google-services.json` from Firebase (Android app `com.crownly.app`) to the project root and set in `app.json`:

```json
"android": {
  "googleServicesFile": "./google-services.json"
}
```

Then rebuild. iOS-only builds work without this file.

## Verify

Firebase Console → **Analytics** → **DebugView** (enable debug mode on a dev device per [Firebase iOS debug docs](https://firebase.google.com/docs/analytics/debugview)).
