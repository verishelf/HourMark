import { resolveAvatarUri } from "@/lib/avatar";
import { getListingCoverImage } from "@/lib/listingImages";
import type { Conversation } from "@/types";

/** Thread started from a listing (watch inquiry). */
export function isWatchConversation(conversation: Conversation): boolean {
  return Boolean(conversation.listing_id && conversation.listing);
}

export function isListingConversation(conversation: Conversation): boolean {
  return Boolean(conversation.listing_id);
}

export function isProfileConversation(conversation: Conversation): boolean {
  return !conversation.listing_id;
}

export function getConversationAvatarUri(conversation: Conversation): string | null {
  if (isWatchConversation(conversation)) {
    return getListingCoverImage(conversation.listing?.images) ?? null;
  }
  return resolveAvatarUri(conversation.other_user?.avatar_url);
}

export function getConversationPrimaryTitle(conversation: Conversation): string {
  if (isWatchConversation(conversation) && conversation.listing) {
    return `${conversation.listing.brand} ${conversation.listing.model}`;
  }
  const user = conversation.other_user;
  if (user?.full_name?.trim()) return user.full_name.trim();
  if (user?.username) return `@${user.username}`;
  return "Conversation";
}

/** Display name shown above @username when both are available. */
export function getConversationDisplayName(conversation: Conversation): string {
  if (isWatchConversation(conversation) && conversation.listing) {
    return conversation.listing.model;
  }
  const user = conversation.other_user;
  if (user?.full_name?.trim()) return user.full_name.trim();
  if (user?.username) return `@${user.username}`;
  return "Conversation";
}

export function getConversationUsername(conversation: Conversation): string | null {
  const username = conversation.other_user?.username;
  if (!username) return null;

  const displayName = getConversationDisplayName(conversation);
  if (displayName === `@${username}`) return null;

  return `@${username}`;
}

export function getConversationSubtitle(conversation: Conversation): string | null {
  return getConversationUsername(conversation);
}
