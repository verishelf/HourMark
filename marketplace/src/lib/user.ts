import type { UserProfile } from "@/lib/types";

export type HeaderUser = Pick<UserProfile, "id" | "username" | "full_name" | "avatar_url" | "verified">;

export function getUserDisplayName(user: HeaderUser): string {
  return user.username ?? user.full_name ?? "Account";
}

export function getUserInitial(user: HeaderUser): string {
  const name = getUserDisplayName(user);
  return name[0]?.toUpperCase() ?? "U";
}
