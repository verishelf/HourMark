import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getOrCreateConversation } from "@/services/messaging";
import { createNotification } from "@/services/notifications";
import type { ListingOffer, OfferStatus } from "@/types";

const MOCK_OFFERS: ListingOffer[] = [];

export async function getOffersForListing(listingId: string): Promise<ListingOffer[]> {
  if (!isSupabaseConfigured) {
    return MOCK_OFFERS.filter((o) => o.listing_id === listingId);
  }

  const { data, error } = await supabase
    .from("listing_offers")
    .select("*, buyer:users!listing_offers_buyer_id_fkey(id, username, avatar_url)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ListingOffer[];
}

export async function getOffersForUser(userId: string): Promise<ListingOffer[]> {
  if (!isSupabaseConfigured) return MOCK_OFFERS;

  const { data, error } = await supabase
    .from("listing_offers")
    .select("*, listing:listings(*)")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ListingOffer[];
}

export async function getOfferById(offerId: string): Promise<ListingOffer | null> {
  if (!isSupabaseConfigured) {
    return MOCK_OFFERS.find((o) => o.id === offerId) ?? null;
  }

  const { data, error } = await supabase
    .from("listing_offers")
    .select("*, listing:listings(*), buyer:users!listing_offers_buyer_id_fkey(*)")
    .eq("id", offerId)
    .maybeSingle();
  if (error) throw error;
  return data as ListingOffer | null;
}

export async function createOffer(params: {
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  message?: string;
}): Promise<ListingOffer> {
  if (!isSupabaseConfigured) {
    const offer: ListingOffer = {
      id: `offer-${Date.now()}`,
      listing_id: params.listingId,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      conversation_id: null,
      amount: params.amount,
      status: "pending",
      parent_offer_id: null,
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      message: params.message ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_OFFERS.unshift(offer);
    return offer;
  }

  const conversation = await getOrCreateConversation({
    listingId: params.listingId,
    buyerId: params.buyerId,
    sellerId: params.sellerId,
  });

  const { data, error } = await supabase
    .from("listing_offers")
    .insert({
      listing_id: params.listingId,
      buyer_id: params.buyerId,
      seller_id: params.sellerId,
      conversation_id: conversation.id,
      amount: params.amount,
      message: params.message ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ListingOffer;
}

export async function respondToOffer(
  offerId: string,
  sellerId: string,
  action: "accept" | "decline" | "counter",
  counterAmount?: number
): Promise<ListingOffer> {
  if (!isSupabaseConfigured) {
    const offer = MOCK_OFFERS.find((o) => o.id === offerId);
    if (!offer) throw new Error("Offer not found");
    if (action === "accept") offer.status = "accepted";
    else if (action === "decline") offer.status = "declined";
    else if (action === "counter" && counterAmount) {
      offer.status = "countered";
      offer.amount = counterAmount;
    }
    offer.updated_at = new Date().toISOString();
    return offer;
  }

  const offer = await getOfferById(offerId);
  if (!offer || offer.seller_id !== sellerId) throw new Error("Offer not found");

  if (action === "accept") {
    const { data, error } = await supabase
      .from("listing_offers")
      .update({ status: "accepted" as OfferStatus, updated_at: new Date().toISOString() })
      .eq("id", offerId)
      .select("*")
      .single();
    if (error) throw error;

    await supabase
      .from("listing_offers")
      .update({ status: "declined" })
      .eq("listing_id", offer.listing_id)
      .eq("status", "pending")
      .neq("id", offerId);

    return data as ListingOffer;
  }

  if (action === "decline") {
    const { data, error } = await supabase
      .from("listing_offers")
      .update({ status: "declined" as OfferStatus, updated_at: new Date().toISOString() })
      .eq("id", offerId)
      .select("*")
      .single();
    if (error) throw error;
    return data as ListingOffer;
  }

  if (action === "counter" && counterAmount) {
    const { data: counter, error: counterError } = await supabase
      .from("listing_offers")
      .insert({
        listing_id: offer.listing_id,
        buyer_id: offer.buyer_id,
        seller_id: offer.seller_id,
        conversation_id: offer.conversation_id,
        amount: counterAmount,
        parent_offer_id: offerId,
        status: "pending",
      })
      .select("*")
      .single();
    if (counterError) throw counterError;

    await supabase
      .from("listing_offers")
      .update({ status: "countered" as OfferStatus, updated_at: new Date().toISOString() })
      .eq("id", offerId);

    await createNotification({
      userId: offer.buyer_id,
      type: "offer_counter",
      title: "Counter offer received",
      body: "The seller sent a counter offer",
      data: { offer_id: counter.id, listing_id: offer.listing_id },
    });

    return counter as ListingOffer;
  }

  throw new Error("Invalid action");
}

export async function removeOffer(offerId: string, userId: string): Promise<void> {
  const offer = await getOfferById(offerId);
  if (!offer) throw new Error("Offer not found");

  const isParticipant = offer.buyer_id === userId || offer.seller_id === userId;
  if (!isParticipant) throw new Error("Forbidden");

  if (offer.status === "pending") {
    if (offer.buyer_id === userId) {
      await withdrawOffer(offerId, userId);
      return;
    }
    if (offer.seller_id === userId) {
      await respondToOffer(offerId, userId, "decline");
      return;
    }
  }

  if (!isSupabaseConfigured) {
    const index = MOCK_OFFERS.findIndex((o) => o.id === offerId);
    if (index >= 0) MOCK_OFFERS.splice(index, 1);
    return;
  }

  const { error } = await supabase
    .from("listing_offers")
    .delete()
    .eq("id", offerId);
  if (error) throw error;
}

export async function withdrawOffer(offerId: string, buyerId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const offer = MOCK_OFFERS.find((o) => o.id === offerId);
    if (offer) offer.status = "withdrawn";
    return;
  }

  const { error } = await supabase
    .from("listing_offers")
    .update({ status: "withdrawn", updated_at: new Date().toISOString() })
    .eq("id", offerId)
    .eq("buyer_id", buyerId)
    .eq("status", "pending");
  if (error) throw error;
}

export async function getAcceptedOfferForListing(
  listingId: string,
  buyerId: string
): Promise<ListingOffer | null> {
  if (!isSupabaseConfigured) {
    return (
      MOCK_OFFERS.find(
        (o) =>
          o.listing_id === listingId &&
          o.buyer_id === buyerId &&
          o.status === "accepted"
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from("listing_offers")
    .select("*")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .eq("status", "accepted")
    .maybeSingle();
  if (error) throw error;
  return data as ListingOffer | null;
}
