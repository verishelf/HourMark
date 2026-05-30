import { MOCK_LISTINGS } from "@/data/mockListings";
import { shouldFallbackToMock } from "@/lib/supabaseErrors";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { UserProfile } from "@/types";

export type FollowCounts = {
  followers: number;
  following: number;
};

const mockFollows = new Set<string>();
const MOCK_KEY_SEP = "::";

const mockBuyer: UserProfile = {
  id: "buyer-1",
  username: "collector_nyc",
  full_name: "Alex Morgan",
  avatar_url:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  bio: "Passionate about independent watchmakers",
  verified: false,
  stripe_account_id: null,
  stripe_onboarding_status: "not_started",
  seller_rating: null,
  created_at: "2024-06-01T00:00:00Z",
};

function ensureMockFollows() {
  if (mockFollows.size > 0) return;
  const seller = MOCK_LISTINGS[0]?.seller;
  if (seller) {
    mockFollows.add(followKey("buyer-1", seller.id));
    mockFollows.add(followKey(seller.id, "buyer-1"));
  }
}

async function profilesByIds(ids: string[]): Promise<UserProfile[]> {
  if (!ids.length) return [];

  if (!isSupabaseConfigured) {
    ensureMockFollows();
    const profiles: UserProfile[] = [];
    for (const id of ids) {
      if (id === "buyer-1") {
        profiles.push(mockBuyer);
        continue;
      }
      const seller = MOCK_LISTINGS[0]?.seller;
      if (seller && id === seller.id) {
        profiles.push(seller);
      }
    }
    return profiles;
  }

  const { data, error } = await supabase.from("users").select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []) as UserProfile[];
}

function followKey(followerId: string, followingId: string) {
  return `${followerId}${MOCK_KEY_SEP}${followingId}`;
}

function parseFollowKey(key: string): [string, string] {
  const index = key.indexOf(MOCK_KEY_SEP);
  return [key.slice(0, index), key.slice(index + MOCK_KEY_SEP.length)];
}

function getMockFollowCounts(userId: string): FollowCounts {
  ensureMockFollows();
  let followers = 0;
  let following = 0;
  for (const key of mockFollows) {
    const [followerId, followingId] = parseFollowKey(key);
    if (followingId === userId) followers += 1;
    if (followerId === userId) following += 1;
  }
  return { followers, following };
}

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  if (!isSupabaseConfigured) {
    return getMockFollowCounts(userId);
  }

  try {
    const [followersRes, followingRes] = await Promise.all([
      supabase
        .from("user_follows")
        .select("follower_id", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("user_follows")
        .select("following_id", { count: "exact", head: true })
        .eq("follower_id", userId),
    ]);

    if (followersRes.error) {
      if (shouldFallbackToMock(followersRes.error)) return getMockFollowCounts(userId);
      throw followersRes.error;
    }
    if (followingRes.error) {
      if (shouldFallbackToMock(followingRes.error)) return getMockFollowCounts(userId);
      throw followingRes.error;
    }

    return {
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
    };
  } catch (error) {
    if (shouldFallbackToMock(error)) return getMockFollowCounts(userId);
    throw error;
  }
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (followerId === followingId) return false;

  if (!isSupabaseConfigured) {
    return mockFollows.has(followKey(followerId, followingId));
  }

  const { data, error } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error("You cannot follow yourself");
  }

  if (!isSupabaseConfigured) {
    mockFollows.add(followKey(followerId, followingId));
    return;
  }

  const { error } = await supabase.from("user_follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });
  if (error) throw error;
}

export async function getFollowers(userId: string): Promise<UserProfile[]> {
  if (!isSupabaseConfigured) {
    ensureMockFollows();
    const ids = [...mockFollows]
      .map(parseFollowKey)
      .filter(([, followingId]) => followingId === userId)
      .map(([followerId]) => followerId);
    return profilesByIds(ids);
  }

  const { data, error } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("following_id", userId);
  if (error) throw error;

  const ids = (data ?? []).map((row) => row.follower_id as string);
  return profilesByIds(ids);
}

export async function getFollowing(userId: string): Promise<UserProfile[]> {
  if (!isSupabaseConfigured) {
    ensureMockFollows();
    const ids = [...mockFollows]
      .map(parseFollowKey)
      .filter(([followerId]) => followerId === userId)
      .map(([, followingId]) => followingId);
    return profilesByIds(ids);
  }

  const { data, error } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (error) throw error;

  const ids = (data ?? []).map((row) => row.following_id as string);
  return profilesByIds(ids);
}

export async function unfollowUser(followerId: string, followingId: string) {
  if (!isSupabaseConfigured) {
    mockFollows.delete(followKey(followerId, followingId));
    return;
  }

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}
