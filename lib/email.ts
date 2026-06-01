/** Apple Sign In "Hide My Email" addresses are not useful for shipping/receipts. */
export function isApplePrivateRelayEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith("@privaterelay.appleid.com");
}

/** Email to prefill in checkout; empty when relay or missing. */
export function checkoutPrefillEmail(authEmail: string | null | undefined): string {
  if (!authEmail || isApplePrivateRelayEmail(authEmail)) return "";
  return authEmail;
}
