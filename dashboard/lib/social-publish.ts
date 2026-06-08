import type { SocialPlatform, SocialPlatformResult } from "@/types/social-media";

type PublishInput = {
  content: string;
  mediaUrls: string[];
  credentials: Record<string, string>;
};

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text };
  }
}

function fail(error: string): SocialPlatformResult {
  return { success: false, error };
}

function ok(externalId: string, url?: string): SocialPlatformResult {
  return {
    success: true,
    external_id: externalId,
    url,
    published_at: new Date().toISOString(),
  };
}

async function publishToX({ content, credentials }: PublishInput): Promise<SocialPlatformResult> {
  const token = credentials.bearer_token?.trim();
  if (!token) return fail("Missing X bearer token");

  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: content.slice(0, 280) }),
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    const err = data as { detail?: string; title?: string; errors?: Array<{ message?: string }> };
    return fail(err.detail ?? err.title ?? err.errors?.[0]?.message ?? `X API error (${res.status})`);
  }

  const id = (data as { data?: { id?: string } }).data?.id;
  return id ? ok(id, `https://x.com/i/web/status/${id}`) : fail("X API returned no tweet id");
}

async function publishToFacebook({ content, mediaUrls, credentials }: PublishInput): Promise<SocialPlatformResult> {
  const token = credentials.access_token?.trim();
  const pageId = credentials.page_id?.trim();
  if (!token || !pageId) return fail("Missing Facebook page access token or page ID");

  const params = new URLSearchParams({ message: content, access_token: token });
  if (mediaUrls[0]) params.set("link", mediaUrls[0]);

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed?${params.toString()}`, {
    method: "POST",
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    const err = data as { error?: { message?: string } };
    return fail(err.error?.message ?? `Facebook API error (${res.status})`);
  }

  const id = String((data as { id?: string }).id ?? "");
  return id ? ok(id, `https://facebook.com/${id}`) : fail("Facebook API returned no post id");
}

async function publishToInstagram({ content, mediaUrls, credentials }: PublishInput): Promise<SocialPlatformResult> {
  const token = credentials.access_token?.trim();
  const igId = credentials.instagram_account_id?.trim();
  if (!token || !igId) return fail("Missing Instagram access token or account ID");
  if (!mediaUrls[0]) return fail("Instagram requires at least one image URL");

  const createParams = new URLSearchParams({
    image_url: mediaUrls[0],
    caption: content,
    access_token: token,
  });

  const createRes = await fetch(
    `https://graph.facebook.com/v21.0/${igId}/media?${createParams.toString()}`,
    { method: "POST" }
  );
  const createData = await parseJsonResponse(createRes);
  if (!createRes.ok) {
    const err = createData as { error?: { message?: string } };
    return fail(err.error?.message ?? `Instagram media create failed (${createRes.status})`);
  }

  const creationId = (createData as { id?: string }).id;
  if (!creationId) return fail("Instagram media container id missing");

  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: token,
  });
  const publishRes = await fetch(
    `https://graph.facebook.com/v21.0/${igId}/media_publish?${publishParams.toString()}`,
    { method: "POST" }
  );
  const publishData = await parseJsonResponse(publishRes);
  if (!publishRes.ok) {
    const err = publishData as { error?: { message?: string } };
    return fail(err.error?.message ?? `Instagram publish failed (${publishRes.status})`);
  }

  const id = (publishData as { id?: string }).id ?? creationId;
  return ok(id);
}

async function publishToLinkedIn({ content, credentials }: PublishInput): Promise<SocialPlatformResult> {
  const token = credentials.access_token?.trim();
  const orgUrn = credentials.organization_urn?.trim();
  if (!token || !orgUrn) return fail("Missing LinkedIn access token or organization URN");

  const body = {
    author: orgUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    const err = data as { message?: string; status?: number };
    return fail(err.message ?? `LinkedIn API error (${res.status})`);
  }

  const id = (data as { id?: string }).id ?? "published";
  return ok(id);
}

async function publishToThreads({ content, credentials }: PublishInput): Promise<SocialPlatformResult> {
  const token = credentials.access_token?.trim();
  const userId = credentials.threads_user_id?.trim();
  if (!token || !userId) return fail("Missing Threads access token or user ID");

  const createParams = new URLSearchParams({
    media_type: "TEXT",
    text: content,
    access_token: token,
  });

  const createRes = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads?${createParams.toString()}`,
    { method: "POST" }
  );
  const createData = await parseJsonResponse(createRes);
  if (!createRes.ok) {
    const err = createData as { error?: { message?: string } };
    return fail(err.error?.message ?? `Threads create failed (${createRes.status})`);
  }

  const creationId = (createData as { id?: string }).id;
  if (!creationId) return fail("Threads creation id missing");

  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: token,
  });
  const publishRes = await fetch(
    `https://graph.threads.net/v1.0/${userId}/threads_publish?${publishParams.toString()}`,
    { method: "POST" }
  );
  const publishData = await parseJsonResponse(publishRes);
  if (!publishRes.ok) {
    const err = publishData as { error?: { message?: string } };
    return fail(err.error?.message ?? `Threads publish failed (${publishRes.status})`);
  }

  const id = (publishData as { id?: string }).id ?? creationId;
  return ok(id);
}

async function publishToPinterest({ content, mediaUrls, credentials }: PublishInput): Promise<SocialPlatformResult> {
  const token = credentials.access_token?.trim();
  const boardId = credentials.board_id?.trim();
  if (!token || !boardId) return fail("Missing Pinterest access token or board ID");
  if (!mediaUrls[0]) return fail("Pinterest requires an image URL");

  const res = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: boardId,
      title: content.slice(0, 100),
      description: content,
      media_source: { source_type: "image_url", url: mediaUrls[0] },
    }),
  });

  const data = await parseJsonResponse(res);
  if (!res.ok) {
    const err = data as { message?: string };
    return fail(err.message ?? `Pinterest API error (${res.status})`);
  }

  const id = (data as { id?: string }).id ?? "published";
  return ok(id);
}

async function publishToTikTok(input: PublishInput): Promise<SocialPlatformResult> {
  void input;
  return fail("TikTok posting requires video upload via TikTok Content Posting API — configure token and use native upload flow");
}

async function publishToYouTube(input: PublishInput): Promise<SocialPlatformResult> {
  void input;
  return fail("YouTube community posts require channel OAuth — use YouTube Data API v3 with authorized channel");
}

const HANDLERS: Record<SocialPlatform, (input: PublishInput) => Promise<SocialPlatformResult>> = {
  x: publishToX,
  facebook: publishToFacebook,
  instagram: publishToInstagram,
  linkedin: publishToLinkedIn,
  threads: publishToThreads,
  pinterest: publishToPinterest,
  tiktok: publishToTikTok,
  youtube: publishToYouTube,
};

export async function publishToSocialPlatform(
  platform: SocialPlatform,
  input: PublishInput
): Promise<SocialPlatformResult> {
  const handler = HANDLERS[platform];
  try {
    return await handler(input);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Unknown publish error");
  }
}

export async function publishToSocialPlatforms(
  platforms: SocialPlatform[],
  content: string,
  mediaUrls: string[],
  credentialsByPlatform: Partial<Record<SocialPlatform, Record<string, string>>>
): Promise<Partial<Record<SocialPlatform, SocialPlatformResult>>> {
  const results: Partial<Record<SocialPlatform, SocialPlatformResult>> = {};

  for (const platform of platforms) {
    const credentials = credentialsByPlatform[platform];
    if (!credentials || Object.keys(credentials).length === 0) {
      results[platform] = fail(`No credentials saved for ${platform}`);
      continue;
    }
    results[platform] = await publishToSocialPlatform(platform, { content, mediaUrls, credentials });
  }

  return results;
}
