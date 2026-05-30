import { getImageContentType } from "@/lib/listingImages";
import { shouldFallbackToMock, toUserFacingError } from "@/lib/supabaseErrors";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  CreatePostInput,
  UpdatePostInput,
  UserPost,
  UserPostComment,
  UserPostDetail,
} from "@/types";

const mockPosts: UserPost[] = [];
const mockLikes = new Map<string, Set<string>>();
const mockComments: UserPostComment[] = [];

function mockLikeCount(postId: string): number {
  return mockLikes.get(postId)?.size ?? 0;
}

function mockCommentCount(postId: string): number {
  return mockComments.filter((c) => c.post_id === postId).length;
}

function mockLikedByUser(postId: string, userId?: string): boolean {
  if (!userId) return false;
  return mockLikes.get(postId)?.has(userId) ?? false;
}

function getMockPostDetail(postId: string, viewerId?: string): UserPostDetail | null {
  const post = mockPosts.find((p) => p.id === postId);
  if (!post) return null;
  return {
    ...post,
    author: post.author ?? { username: "collector", avatar_url: null },
    like_count: mockLikeCount(postId),
    comment_count: mockCommentCount(postId),
    liked_by_me: mockLikedByUser(postId, viewerId),
  };
}

function getMockUserPosts(userId: string): UserPost[] {
  return mockPosts
    .filter((p) => p.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function getMockPostComments(postId: string): UserPostComment[] {
  return mockComments
    .filter((c) => c.post_id === postId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getPostById(postId: string): Promise<UserPost | null> {
  return getPostDetail(postId);
}

export async function getPostDetail(
  postId: string,
  viewerId?: string
): Promise<UserPostDetail | null> {
  if (!isSupabaseConfigured) {
    return getMockPostDetail(postId, viewerId);
  }

  try {
    const { data: post, error } = await supabase
      .from("user_posts")
      .select("*, author:users!user_id(username, avatar_url)")
      .eq("id", postId)
      .single();

    if (error) {
      if (shouldFallbackToMock(error)) return getMockPostDetail(postId, viewerId);
      return null;
    }
    if (!post) return null;

    const [likesRes, commentsRes, likedRes] = await Promise.all([
      supabase
        .from("user_post_likes")
        .select("user_id", { count: "exact", head: true })
        .eq("post_id", postId),
      supabase
        .from("user_post_comments")
        .select("id", { count: "exact", head: true })
        .eq("post_id", postId),
      viewerId
        ? supabase
            .from("user_post_likes")
            .select("user_id")
            .eq("post_id", postId)
            .eq("user_id", viewerId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    return {
      ...(post as UserPost),
      like_count: likesRes.count ?? 0,
      comment_count: commentsRes.count ?? 0,
      liked_by_me: Boolean(likedRes.data),
    };
  } catch (error) {
    if (shouldFallbackToMock(error)) return getMockPostDetail(postId, viewerId);
    return null;
  }
}

export async function getUserPosts(userId: string): Promise<UserPost[]> {
  if (!isSupabaseConfigured) {
    return getMockUserPosts(userId);
  }

  try {
    const { data, error } = await supabase
      .from("user_posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      if (shouldFallbackToMock(error)) return getMockUserPosts(userId);
      throw new Error(toUserFacingError(error, "Could not load posts"));
    }
    return (data ?? []) as UserPost[];
  } catch (error) {
    if (shouldFallbackToMock(error)) return getMockUserPosts(userId);
    throw error;
  }
}

export async function createPost(
  userId: string,
  input: CreatePostInput
): Promise<UserPost> {
  if (!isSupabaseConfigured) {
    const post: UserPost = {
      id: `mock-post-${Date.now()}`,
      user_id: userId,
      caption: input.caption ?? null,
      image_url: input.image_url,
      created_at: new Date().toISOString(),
      author: { username: "collector", avatar_url: null },
    };
    mockPosts.unshift(post);
    return post;
  }

  try {
    const { data, error } = await supabase
      .from("user_posts")
      .insert({
        user_id: userId,
        caption: input.caption?.trim() || null,
        image_url: input.image_url,
      })
      .select("*")
      .single();

    if (error) {
      if (shouldFallbackToMock(error)) {
        const post: UserPost = {
          id: `mock-post-${Date.now()}`,
          user_id: userId,
          caption: input.caption ?? null,
          image_url: input.image_url,
          created_at: new Date().toISOString(),
        };
        mockPosts.unshift(post);
        return post;
      }
      throw new Error(toUserFacingError(error, "Could not create post"));
    }
    return data as UserPost;
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      const post: UserPost = {
        id: `mock-post-${Date.now()}`,
        user_id: userId,
        caption: input.caption ?? null,
        image_url: input.image_url,
        created_at: new Date().toISOString(),
      };
      mockPosts.unshift(post);
      return post;
    }
    throw error;
  }
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const index = mockPosts.findIndex((p) => p.id === postId && p.user_id === userId);
    if (index >= 0) mockPosts.splice(index, 1);
    mockLikes.delete(postId);
    for (let i = mockComments.length - 1; i >= 0; i--) {
      if (mockComments[i].post_id === postId) mockComments.splice(i, 1);
    }
    return;
  }

  const { error } = await supabase
    .from("user_posts")
    .delete()
    .eq("id", postId)
    .eq("user_id", userId);

  if (error && !shouldFallbackToMock(error)) throw error;
}

export async function updatePost(
  postId: string,
  userId: string,
  input: UpdatePostInput
): Promise<UserPost> {
  if (!isSupabaseConfigured) {
    const post = mockPosts.find((p) => p.id === postId && p.user_id === userId);
    if (!post) throw new Error("Post not found");
    if (input.caption !== undefined) post.caption = input.caption?.trim() || null;
    if (input.image_url) post.image_url = input.image_url;
    return post;
  }

  const updates: Record<string, string | null> = {};
  if (input.caption !== undefined) {
    updates.caption = input.caption?.trim() || null;
  }
  if (input.image_url) {
    updates.image_url = input.image_url;
  }

  const { data, error } = await supabase
    .from("user_posts")
    .update(updates)
    .eq("id", postId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    if (shouldFallbackToMock(error)) {
      const post = mockPosts.find((p) => p.id === postId && p.user_id === userId);
      if (!post) throw new Error("Post not found");
      if (input.caption !== undefined) post.caption = input.caption?.trim() || null;
      if (input.image_url) post.image_url = input.image_url;
      return post;
    }
    throw new Error(toUserFacingError(error, "Could not update post"));
  }
  return data as UserPost;
}

export async function togglePostLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; like_count: number }> {
  if (!isSupabaseConfigured) {
    const set = mockLikes.get(postId) ?? new Set<string>();
    if (set.has(userId)) {
      set.delete(userId);
    } else {
      set.add(userId);
    }
    mockLikes.set(postId, set);
    return { liked: set.has(userId), like_count: set.size };
  }

  try {
    const { data: existing, error: readError } = await supabase
      .from("user_post_likes")
      .select("user_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (readError && shouldFallbackToMock(readError)) {
      const set = mockLikes.get(postId) ?? new Set<string>();
      if (set.has(userId)) set.delete(userId);
      else set.add(userId);
      mockLikes.set(postId, set);
      return { liked: set.has(userId), like_count: set.size };
    }

    if (existing) {
      const { error } = await supabase
        .from("user_post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("user_post_likes")
        .insert({ post_id: postId, user_id: userId });
      if (error) throw error;
    }

    const { count } = await supabase
      .from("user_post_likes")
      .select("user_id", { count: "exact", head: true })
      .eq("post_id", postId);

    return { liked: !existing, like_count: count ?? 0 };
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      const set = mockLikes.get(postId) ?? new Set<string>();
      if (set.has(userId)) set.delete(userId);
      else set.add(userId);
      mockLikes.set(postId, set);
      return { liked: set.has(userId), like_count: set.size };
    }
    throw new Error(toUserFacingError(error, "Could not update like"));
  }
}

export async function getPostComments(postId: string): Promise<UserPostComment[]> {
  if (!isSupabaseConfigured) {
    return getMockPostComments(postId);
  }

  try {
    const { data, error } = await supabase
      .from("user_post_comments")
      .select("*, author:users!user_id(username, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      if (shouldFallbackToMock(error)) return getMockPostComments(postId);
      throw new Error(toUserFacingError(error, "Could not load comments"));
    }
    return (data ?? []) as UserPostComment[];
  } catch (error) {
    if (shouldFallbackToMock(error)) return getMockPostComments(postId);
    throw error;
  }
}

export async function addPostComment(
  postId: string,
  userId: string,
  text: string
): Promise<UserPostComment> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  if (!isSupabaseConfigured) {
    const comment: UserPostComment = {
      id: `mock-comment-${Date.now()}`,
      post_id: postId,
      user_id: userId,
      text: trimmed,
      created_at: new Date().toISOString(),
      author: { username: "collector", avatar_url: null },
    };
    mockComments.push(comment);
    return comment;
  }

  try {
    const { data, error } = await supabase
      .from("user_post_comments")
      .insert({ post_id: postId, user_id: userId, text: trimmed })
      .select("*, author:users!user_id(username, avatar_url)")
      .single();

    if (error) {
      if (shouldFallbackToMock(error)) {
        const comment: UserPostComment = {
          id: `mock-comment-${Date.now()}`,
          post_id: postId,
          user_id: userId,
          text: trimmed,
          created_at: new Date().toISOString(),
        };
        mockComments.push(comment);
        return comment;
      }
      throw new Error(toUserFacingError(error, "Could not post comment"));
    }
    return data as UserPostComment;
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      const comment: UserPostComment = {
        id: `mock-comment-${Date.now()}`,
        post_id: postId,
        user_id: userId,
        text: trimmed,
        created_at: new Date().toISOString(),
      };
      mockComments.push(comment);
      return comment;
    }
    throw error;
  }
}

export async function uploadPostImage(
  userId: string,
  uri: string
): Promise<string> {
  if (!isSupabaseConfigured) return uri;

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Could not read photo (${response.status}). Try picking it again.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new Error("Photo file is empty. Try picking it again.");
  }

  const { ext, contentType } = getImageContentType(uri);
  const path = `${userId}/${Date.now()}.${ext}`;

  try {
    const { error } = await supabase.storage.from("post-images").upload(path, arrayBuffer, {
      contentType,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      if (shouldFallbackToMock(error)) return uri;
      throw error;
    }

    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    if (shouldFallbackToMock(error)) return uri;
    throw error;
  }
}
