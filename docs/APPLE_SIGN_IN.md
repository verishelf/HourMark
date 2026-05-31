# Sign in with Apple (Crownly + Supabase)

Your app already implements native Apple sign-in in `app/auth/login.tsx` → `services/auth.ts` (`signInWithIdToken`).

## Files in this repo

| File | Purpose |
|------|---------|
| `AuthKey_74HKPYSZRQ.p8` | Apple Sign in with Apple **private key** (Key ID: `74HKPYSZRQ`) — **gitignored**, keep only on your machine |
| `scripts/generate-apple-client-secret.mjs` | Builds the JWT Supabase expects in the Apple provider **Secret** field |

**Never commit** the `.p8` file or paste the generated secret into source code.

---

## 1. Apple Developer

1. [developer.apple.com](https://developer.apple.com/account) → **Identifiers**.
2. **App ID** `com.crownly.app` → enable **Sign in with Apple**.
3. Create a **Services ID** (for Supabase secret / web, e.g. `com.crownly.app.signin`):
   - Enable Sign in with Apple → configure **Primary App ID** = `com.crownly.app`.
   - Domains & Return URLs: add your Supabase auth callback, e.g.  
     `https://<project-ref>.supabase.co/auth/v1/callback`
4. **Keys** → you already created key `74HKPYSZRQ` (the `.p8` in repo root).

Note your **Team ID** (Membership details).

---

## 2. Generate secret for Supabase

```bash
npm install   # installs devDependency `jose` if needed
APPLE_TEAM_ID=YOUR_TEAM_ID \
APPLE_SERVICES_ID=com.crownly.app.signin \
npm run apple:client-secret
```

Copy the printed JWT into **Supabase Dashboard → Authentication → Providers → Apple → Secret Key**.

---

## 3. Supabase Apple provider

| Field | Value |
|-------|--------|
| Enable | On |
| **Client IDs** | `com.crownly.app` (bundle ID for native app). Add your **Services ID** too if you use web OAuth: `com.crownly.app.signin` |
| **Secret Key** | JWT from the script above (rotate every ≤6 months) |

Native-only note: some setups work with an empty secret if you only use `signInWithIdToken` on iOS. If Apple login fails with “invalid client”, add the JWT secret and both IDs.

---

## 4. App env

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Restart Expo after changing `.env`.

---

## 5. Run on iOS

- Use a **development build** or **EAS build** (`npx expo run:ios` / `eas build`). Sign in with Apple does **not** work in Expo Go.
- Test on a device or simulator signed into an Apple ID.
- Login screen → **Sign in with Apple**.

---

## 6. Verify

- Supabase **Authentication → Users** — new user, provider `apple`.
- **Table Editor → users** — row created by `handle_new_user` trigger.

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| Invalid Apple token | Client IDs include `com.crownly.app` exactly |
| Secret rejected | Regenerate JWT; Team ID / Services ID / Key ID must match Apple portal |
| Button missing | iOS only; use dev build |
| No email | Apple may hide email; user gets `*@privaterelay.appleid.com` |
