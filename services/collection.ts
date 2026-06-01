import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Order, WatchCollectionItem } from "@/types";

const MOCK_COLLECTION: WatchCollectionItem[] = [];

export type AddCollectionInput = {
  brand: string;
  model: string;
  reference_number?: string;
  serial_number?: string;
  purchase_price?: number;
  estimated_value?: number;
  purchase_date?: string;
  includes_box?: boolean;
  includes_papers?: boolean;
  image_url?: string;
  notes?: string;
};

export async function getCollection(userId: string): Promise<WatchCollectionItem[]> {
  if (!isSupabaseConfigured) {
    return MOCK_COLLECTION.filter((c) => c.user_id === userId);
  }

  const { data, error } = await supabase
    .from("watch_collection")
    .select("*, passport:authenticity_passports(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WatchCollectionItem[];
}

export async function addToCollection(
  userId: string,
  input: AddCollectionInput
): Promise<WatchCollectionItem> {
  if (!isSupabaseConfigured) {
    const item: WatchCollectionItem = {
      id: `col-${Date.now()}`,
      user_id: userId,
      brand: input.brand,
      model: input.model,
      reference_number: input.reference_number ?? null,
      serial_number: input.serial_number ?? null,
      purchase_price: input.purchase_price ?? null,
      estimated_value: input.estimated_value ?? null,
      purchase_date: input.purchase_date ?? null,
      includes_box: input.includes_box ?? false,
      includes_papers: input.includes_papers ?? false,
      image_url: input.image_url ?? null,
      order_id: null,
      passport_id: null,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
    };
    MOCK_COLLECTION.unshift(item);
    return item;
  }

  const { data, error } = await supabase
    .from("watch_collection")
    .insert({ user_id: userId, ...input })
    .select("*")
    .single();
  if (error) throw error;
  return data as WatchCollectionItem;
}

export async function addOrderToCollection(
  userId: string,
  order: Order,
  passportId?: string
): Promise<WatchCollectionItem | null> {
  const listing = order.listing;
  if (!listing) return null;

  const existing = await getCollection(userId);
  if (existing.some((c) => c.order_id === order.id)) return null;

  return addToCollection(userId, {
    brand: listing.brand,
    model: listing.model,
    reference_number: listing.reference_number ?? undefined,
    serial_number: listing.extracted_serial_number ?? listing.serial_number ?? undefined,
    purchase_price: order.amount,
    estimated_value: order.amount,
    purchase_date: new Date().toISOString().slice(0, 10),
    includes_box: listing.includes_box,
    includes_papers: listing.includes_papers,
    image_url: listing.images[0],
    notes: `Purchased via Crownly escrow`,
  });
}

export async function updateCollectionValue(
  itemId: string,
  userId: string,
  estimatedValue: number
): Promise<void> {
  if (!isSupabaseConfigured) {
    const item = MOCK_COLLECTION.find((c) => c.id === itemId);
    if (item) item.estimated_value = estimatedValue;
    return;
  }

  await supabase
    .from("watch_collection")
    .update({ estimated_value: estimatedValue })
    .eq("id", itemId)
    .eq("user_id", userId);
}

export async function removeFromCollection(itemId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const idx = MOCK_COLLECTION.findIndex((c) => c.id === itemId);
    if (idx >= 0) MOCK_COLLECTION.splice(idx, 1);
    return;
  }

  await supabase.from("watch_collection").delete().eq("id", itemId).eq("user_id", userId);
}

export function getCollectionStats(items: WatchCollectionItem[]) {
  const totalCost = items.reduce((sum, i) => sum + (i.purchase_price ?? 0), 0);
  const totalValue = items.reduce((sum, i) => sum + (i.estimated_value ?? i.purchase_price ?? 0), 0);
  const gainLoss = totalValue - totalCost;
  return { totalCost, totalValue, gainLoss, count: items.length };
}
