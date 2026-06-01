import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { SellerReview } from "@/types";

const MOCK_REVIEWS: SellerReview[] = [];

export async function getSellerReviews(sellerId: string): Promise<SellerReview[]> {
  if (!isSupabaseConfigured) {
    return MOCK_REVIEWS.filter((r) => r.seller_id === sellerId);
  }

  const { data, error } = await supabase
    .from("seller_reviews")
    .select("*, reviewer:users!seller_reviews_reviewer_id_fkey(username, avatar_url)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SellerReview[];
}

export async function getReviewForOrder(orderId: string): Promise<SellerReview | null> {
  if (!isSupabaseConfigured) {
    return MOCK_REVIEWS.find((r) => r.order_id === orderId) ?? null;
  }

  const { data, error } = await supabase
    .from("seller_reviews")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (error) throw error;
  return data as SellerReview | null;
}

export async function submitReview(params: {
  orderId: string;
  reviewerId: string;
  sellerId: string;
  rating: number;
  comment?: string;
}): Promise<SellerReview> {
  if (!isSupabaseConfigured) {
    const review: SellerReview = {
      id: `review-${Date.now()}`,
      order_id: params.orderId,
      reviewer_id: params.reviewerId,
      seller_id: params.sellerId,
      rating: params.rating,
      comment: params.comment ?? null,
      created_at: new Date().toISOString(),
    };
    MOCK_REVIEWS.unshift(review);
    return review;
  }

  const { data, error } = await supabase
    .from("seller_reviews")
    .insert({
      order_id: params.orderId,
      reviewer_id: params.reviewerId,
      seller_id: params.sellerId,
      rating: params.rating,
      comment: params.comment ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SellerReview;
}

export function isTrustedSeller(profile: {
  seller_rating?: number | null;
  seller_review_count?: number;
  total_sales?: number;
}): boolean {
  return (
    (profile.seller_review_count ?? 0) >= 5 &&
    (profile.seller_rating ?? 0) >= 4.8 &&
    (profile.total_sales ?? 0) >= 10
  );
}
