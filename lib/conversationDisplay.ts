import { getListingCoverImage } from "@/lib/listingImages";
import type { Conversation } from "@/types";

export const CONVERSATION_DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop";

/** Thread started from a listing (watch inquiry). */
export function isWatchConversation(conversation: Conversation): boolean {
  return Boolean(conversation.listing_id && conversation.listing);
}

export function getConversationAvatarUri(conversation: Conversation): string {
  if (isWatchConversation(conversation)) {
    return getListingCoverImage(conversation.listing?.images) ?? CONVERSATION_DEFAULT_AVATAR;
  }
  return conversation.other_user?.avatar_url ?? CONVERSATION_DEFAULT_AVATAR;
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

export function getConversationSubtitle(conversation: Conversation): string | null {
  if (isWatchConversation(conversation) && conversation.other_user?.username) {
    return `@${conversation.other_user.username}`;
  }
  return null;
}
