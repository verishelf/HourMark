#!/usr/bin/env node
/**
 * Builds the Apple OAuth client secret (JWT) for Supabase Auth → Providers → Apple.
 *
 * Required env:
 *   APPLE_TEAM_ID       — Apple Developer Team ID (10 chars)
 *   APPLE_SERVICES_ID   — Services ID identifier (e.g. com.crownly.app.signin)
 *
 * Optional:
 *   APPLE_KEY_ID        — defaults to 74HKPYSZRQ (from AuthKey_74HKPYSZRQ.p8)
 *   APPLE_KEY_PATH      — defaults to ./AuthKey_74HKPYSZRQ.p8 in repo root
 *
 * Run: npm run apple:client-secret
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { SignJWT, importPKCS8 } from "jose";

const teamId = process.env.APPLE_TEAM_ID;
const clientId = process.env.APPLE_SERVICES_ID;
const keyId = process.env.APPLE_KEY_ID ?? "74HKPYSZRQ";
const keyPath = resolve(process.env.APPLE_KEY_PATH ?? `AuthKey_${keyId}.p8`);

if (!teamId || !clientId) {
  console.error(
    "Missing env vars. Example:\n" +
      "  APPLE_TEAM_ID=AB12CD34EF APPLE_SERVICES_ID=com.crownly.app.signin npm run apple:client-secret"
  );
  process.exit(1);
}

if (!existsSync(keyPath)) {
  console.error(`Key file not found: ${keyPath}`);
  process.exit(1);
}

const privateKey = await importPKCS8(readFileSync(keyPath, "utf8"), "ES256");

const now = Math.floor(Date.now() / 1000);
const exp = now + 86400 * 180; // max 6 months

const secret = await new SignJWT({})
  .setAudience("https://appleid.apple.com")
  .setIssuer(teamId)
  .setIssuedAt(now)
  .setExpirationTime(exp)
  .setSubject(clientId)
  .setProtectedHeader({ alg: "ES256", kid: keyId })
  .sign(privateKey);

console.log("\nApple client secret (paste into Supabase → Authentication → Apple → Secret Key):\n");
console.log(secret);
console.log("\nExpires around:", new Date(exp * 1000).toISOString());
console.log("Regenerate before expiry. Never commit the .p8 file or this JWT to git.\n");
