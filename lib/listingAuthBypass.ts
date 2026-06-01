import type { UserProfile } from "@/types";

export function hasListingAuthBypass(profile: UserProfile | null | undefined): boolean {
  return Boolean(profile?.bypass_listing_auth);
}
