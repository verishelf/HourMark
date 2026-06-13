# Crownly — iOS EAS build & App Store

Project: [@mrposada/crownly](https://expo.dev/accounts/mrposada/projects/crownly)  
EAS project ID: `33b3e0b8-9e4d-488e-8411-47365cbc034c`  
Bundle ID: `com.crownly.app`  
Apple Team ID: `Q834NS68MG`

---

## 1. One-time setup

### Install EAS CLI & log in

```bash
npm install
npx eas-cli login
npx eas-cli whoami
```

### Apple Developer (developer.apple.com)

1. **App ID** `com.crownly.app` with:
   - Sign in with Apple
   - Apple Pay (merchant `merchant.com.crownly.app` — matches `app.json` Stripe plugin)
2. **Certificates** — EAS can manage these on first build (`eas credentials`).
3. **App Store Connect** — create app **Crownly**, bundle ID `com.crownly.app`.
4. Note the **Apple ID** (numeric only, e.g. `1234567891`) from App Store Connect → **App Information** → **Apple ID**. Add to `eas.json` under `submit.production.ios.ascAppId` once you have it, or pass at submit time (see below).

### EAS environment variables (production)

Set secrets on Expo (never commit `.env`):

```bash
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_REF.supabase.co"
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_live_..."
# Optional if not using default Supabase functions URL:
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://YOUR_REF.supabase.co/functions/v1"
```

Use **live** Stripe publishable key for App Store builds. Keep test keys for preview/internal only.

Wire transfer copy (optional):

```bash
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_WIRE_BANK_NAME --value "..."
# ... other EXPO_PUBLIC_WIRE_* from .env.example
```

### Supabase & Stripe (backend)

- Deploy Edge Functions: `supabase functions deploy`
- Set production secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, wire vars
- Apple Sign In: `com.crownly.app` in Supabase Apple Client IDs (not `host.exp.Exponent` for store builds). See [APPLE_SIGN_IN.md](./APPLE_SIGN_IN.md).

---

## 2. Build for iOS (App Store binary)

```bash
npx eas-cli build --platform ios --profile production
```

Or:

```bash
npm run eas:build:ios
```

- Profile `production` in `eas.json`: App Store distribution, auto-increment build number.
- First run will prompt for Apple credentials or use `eas credentials` to configure.

**Test on device before submit:**

```bash
npx eas-cli build --platform ios --profile preview
```

Install via QR link from the Expo dashboard (internal distribution).

---

## 3. Submit to App Store Connect

After a successful production build:

```bash
npx eas-cli submit --platform ios --profile production --latest
```

Or:

```bash
npm run eas:submit:ios
```

**Option A — interactive (no `ascAppId` in config yet):**

```bash
npx eas-cli submit --platform ios --profile production --latest
```

EAS will prompt you to pick the Crownly app in App Store Connect.

**Option B — pass the numeric App ID:**

```bash
npx eas-cli submit --platform ios --profile production --latest --id YOUR_NUMERIC_APP_ID
```

To save it for later, add to `eas.json`:

```json
"ascAppId": "1234567891"
```

(Digits only — not the bundle id `com.crownly.app`.)

**Option C:** Download `.ipa` from EAS and upload with **Transporter**.

---

## 4. App Store Connect metadata (manual)

| Field | Suggested |
|-------|-----------|
| **Name** | Crownly |
| **Subtitle** | Curated luxury watches |
| **Category** | Shopping (primary), Lifestyle (secondary) |
| **Privacy Policy URL** | Your live `/privacy` page |
| **Support URL** | Website or support email page |
| **Marketing URL** | Optional |
| **Copyright** | © 2026 Crownly Inc. (adjust) |
| **Age rating** | Complete questionnaire (UGC, payments → likely 12+ or 17+) |
| **Screenshots** | 6.7", 6.5", 5.5" iPhone + iPad if supporting tablets |
| **App icon** | Uses `assets/icon.png` (1024×1024) from build |
| **Description** | Marketplace for authenticated luxury timepieces |
| **Keywords** | watches, luxury, rolex, marketplace, authenticated |
| **Promotional text** | Short seasonal line (170 chars) |

### Export compliance

`app.json` sets `ITSAppUsesNonExemptEncryption: false` — in Connect answer **No** to custom encryption (standard HTTPS only).

### Sign in with Apple

Required if you offer other social logins; Crownly uses Apple Sign In — ensure App ID capability matches.

### Review notes

- Provide demo account (email/password) if login required.
- Explain seller verification / Stripe Connect flow if reviewers ask about payouts.

---

## 5. Versioning

| Field | Location |
|-------|----------|
| Marketing version `1.1.0` | `app.json` → `expo.version` |
| Build number | EAS `autoIncrement` + `ios.buildNumber` seed |

Bump `expo.version` for each App Store release; EAS increments build number automatically on production builds.

---

## 6. Checklist before submit

- [ ] Production Supabase + Stripe secrets on EAS
- [ ] App Store Connect app created; numeric **Apple ID** known (optional in `eas.json`)
- [ ] Apple Pay merchant ID live in Stripe & Apple Developer
- [ ] Privacy policy & terms URLs live
- [ ] Tested Sign in with Apple on **production** build (not Expo Go)
- [ ] Tested listing create, checkout, messages on production API
- [ ] App icon 1024×1024 (`assets/icon.png`)
- [ ] No test/mock-only behavior blocking real users

---

## 7. Useful commands

```bash
npx eas-cli project:info
npx eas-cli build:list --platform ios --limit 5
npx eas-cli credentials --platform ios
npx eas-cli secret:list
```
