import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_LISTINGS } from "@/data/mockListings";
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
  return (data ?? []) as Conversation[];
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

  const channel = supabase
    .channel(`messages:${conversationId}`)
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
