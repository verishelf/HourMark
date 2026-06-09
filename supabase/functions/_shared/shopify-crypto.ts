const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

let cachedKey: CryptoKey | null = null;

async function key(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const raw = Deno.env.get("SHOPIFY_TOKEN_ENCRYPTION_KEY");
  if (!raw || raw.length < 32) {
    throw new Error("SHOPIFY_TOKEN_ENCRYPTION_KEY must be at least 32 characters");
  }
  const bytes = new TextEncoder().encode(raw.slice(0, 32));
  cachedKey = await crypto.subtle.importKey("raw", bytes, { name: ALGORITHM }, false, [
    "encrypt",
    "decrypt",
  ]);
  return cachedKey;
}

export async function encryptShopifyToken(plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const cryptoKey = await key();
  const cipher = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, cryptoKey, encoded);
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptShopifyToken(encrypted: string): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);
  const cryptoKey = await key();
  const plain = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, cryptoKey, data);
  return new TextDecoder().decode(plain);
}
