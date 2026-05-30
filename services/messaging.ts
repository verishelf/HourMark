import { toUserFacingError } from "@/lib/supabaseErrors";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_LISTINGS } from "@/data/mockListings";
import { getProfile } from "@/services/auth";
import type { Conversation, Message } from "@/types";

const mockListing = MOCK_LISTINGS[0];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    listing_id: "1",
    buyer_id: "buyer-1",
    seller_id: "seller-1",
    created_at: "2025-03-10T00:00:00Z",
    updated_at: "2025-03-12T14:30:00Z",
    listing: mockListing,
    other_user: mockListing.seller,
    last_message: {
      id: "msg-3",
      conversation_id: "conv-1",
      sender_id: "seller-1",
      text: "Yes, full set with box and papers included.",
      read_at: null,
      created_at: "2025-03-12T14:30:00Z",
    },
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "conv-1": [
    {
      id: "msg-1",
      conversation_id: "conv-1",
      sender_id: "buyer-1",
      text: "Is this still available?",
      read_at: "2025-03-11T10:00:00Z",
      created_at: "2025-03-11T09:45:00Z",
    },
    {
      id: "msg-2",
      conversation_id: "conv-1",
      sender_id: "buyer-1",
      text: "Does it come with the full set?",
      read_at: "2025-03-12T14:00:00Z",
      created_at: "2025-03-12T13:00:00Z",
    },
    {
      id: "msg-3",
      conversation_id: "conv-1",
      sender_id: "seller-1",
      text: "Yes, full set with box and papers included.",
      read_at: null,
      created_at: "2025-03-12T14:30:00Z",
    },
  ],
};

export async function getConversations(userId: string): Promise<Conversation[]> {
  if (!isSupabaseConfigured) return MOCK_CONVERSATIONS;

  const { data, error } = await supabase
    .from("conversations")
    .select("*, listing:listings(*)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const conversations = (data ?? []) as Conversation[];
  const otherUserIds = Array.from(
    new Set(
      conversations
        .map((conv) => (conv.buyer_id === userId ? conv.seller_id : conv.buyer_id))
        .filter(Boolean)
    )
  );

  if (!otherUserIds.length) return conversations;

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*")
    .in("id", otherUserIds);
  if (usersError) throw usersError;

  const userMap = new Map((users ?? []).map((u) => [u.id as string, u]));
  return conversations.map((conv) => {
    const otherUserId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
    return {
      ...conv,
      other_user: (userMap.get(otherUserId) as Conversation["other_user"]) ?? conv.other_user,
    };
  });
}

export async function getOrCreateConversation(params: {
  listingId: string;
  buyerId: string;
  sellerId: string;
}): Promise<Conversation> {
  if (!isSupabaseConfigured) {
    const existing = MOCK_CONVERSATIONS.find(
      (c) =>
        c.listing_id === params.listingId &&
        c.buyer_id === params.buyerId &&
        c.seller_id === params.sellerId
    );
    if (existing) return existing;

    const created: Conversation = {
      id: `conv-${Date.now()}`,
      listing_id: params.listingId,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return created;
  }

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("*")
    .eq("listing_id", params.listingId)
    .eq("buyer_id", params.buyerId)
    .eq("seller_id", params.sellerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing as Conversation;

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({
      listing_id: params.listingId,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
    })
    .select("*")
    .single();

  if (createError) throw createError;
  return created as Conversation;
}

export async function getOrCreateConversationWithSeller(params: {
  buyerId: string;
  sellerId: string;
  listingId?: string | null;
}): Promise<Conversation> {
  if (!isSupabaseConfigured) {
    const existing = MOCK_CONVERSATIONS.find(
      (c) => c.buyer_id === params.buyerId && c.seller_id === params.sellerId
    );
    if (existing) return existing;

    const created: Conversation = {
      id: `conv-${Date.now()}`,
      listing_id: params.listingId ?? MOCK_CONVERSATIONS[0]?.listing_id ?? null,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return created;
  }

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("*")
    .eq("buyer_id", params.buyerId)
    .eq("seller_id", params.sellerId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing as Conversation;

  const { data: created, error: createError } = await supabase
    .from("conversations")
    .insert({
      listing_id: params.listingId ?? null,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
    })
    .select("*")
    .single();

  if (createError) throw createError;
  return created as Conversation;
}

export async function getConversationById(
  conversationId: string,
  currentUserId: string
): Promise<Conversation | null> {
  if (!isSupabaseConfigured) {
    const conv = MOCK_CONVERSATIONS.find((c) => c.id === conversationId) ?? null;
    if (!conv) return null;
    const otherId = conv.buyer_id === currentUserId ? conv.seller_id : conv.buyer_id;
    return {
      ...conv,
      other_user:
        conv.other_user ??
        ({
          id: otherId,
          username: otherId === "seller-1" ? "seller" : "buyer",
          avatar_url: mockListing.seller.avatar_url ?? null,
          bio: null,
          verified: false,
          stripe_account_id: null,
          stripe_onboarding_status: "not_started",
          seller_rating: null,
          created_at: new Date().toISOString(),
        } as Conversation["other_user"]),
    };
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const conv = data as Conversation;
  const otherUserId = conv.buyer_id === currentUserId ? conv.seller_id : conv.buyer_id;
  const otherUser = await getProfile(otherUserId);
  return {
    ...conv,
    other_user: otherUser ?? undefined,
  };
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (!isSupabaseConfigured) {
    return MOCK_MESSAGES[conversationId] ?? [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<Message> {
  if (!isSupabaseConfigured) {
    const msg: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: senderId,
      text,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    return msg;
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, text })
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data as Message;
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
) {
  if (!isSupabaseConfigured) return () => {};

  const channelName = `messages:${conversationId}:${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as Message)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markMessagesAsRead(
  conversationId: string,
  userId: string
) {
  if (!isSupabaseConfigured) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

async function touchConversationUpdatedAt(conversationId: string) {
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function deleteMessage(
  messageId: string,
  senderId: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    for (const convId of Object.keys(MOCK_MESSAGES)) {
      const list = MOCK_MESSAGES[convId];
      const index = list.findIndex((m) => m.id === messageId && m.sender_id === senderId);
      if (index >= 0) {
        list.splice(index, 1);
        const conv = MOCK_CONVERSATIONS.find((c) => c.id === convId);
        if (conv) {
          conv.last_message = list[list.length - 1] ?? undefined;
          conv.updated_at = new Date().toISOString();
        }
        return;
      }
    }
    throw new Error("Message not found");
  }

  const { data, error } = await supabase
    .from("messages")
    .delete()
    .eq("id", messageId)
    .eq("sender_id", senderId)
    .select("id, conversation_id");

  if (error) {
    throw new Error(toUserFacingError(error, "Could not delete message"));
  }

  const deleted = data ?? [];
  if (deleted.length === 0) {
    throw new Error(
      "Message could not be deleted. Apply the message delete migration in Supabase, or sign in again."
    );
  }

  const conversationId = deleted[0].conversation_id as string;
  if (conversationId) {
    await touchConversationUpdatedAt(conversationId);
  }
}

export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    const index = MOCK_CONVERSATIONS.findIndex((c) => c.id === conversationId);
    if (index >= 0) {
      const conv = MOCK_CONVERSATIONS[index];
      if (conv.buyer_id === userId || conv.seller_id === userId) {
        MOCK_CONVERSATIONS.splice(index, 1);
        delete MOCK_MESSAGES[conversationId];
      }
    }
    return;
  }

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
  if (error) throw error;
}
