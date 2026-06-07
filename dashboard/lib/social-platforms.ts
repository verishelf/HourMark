import type { SocialPlatform, SocialPlatformDefinition } from "@/types/social-media";

export const SOCIAL_PLATFORMS: SocialPlatformDefinition[] = [
  {
    id: "instagram",
    name: "Instagram",
    color: "#E4405F",
    charLimit: 2200,
    supportsMedia: true,
    fields: [
      { key: "access_token", label: "Access Token", secret: true, required: true },
      { key: "instagram_account_id", label: "Instagram Business Account ID", required: true },
    ],
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    charLimit: 63206,
    supportsMedia: true,
    fields: [
      { key: "access_token", label: "Page Access Token", secret: true, required: true },
      { key: "page_id", label: "Facebook Page ID", required: true },
    ],
  },
  {
    id: "x",
    name: "X (Twitter)",
    color: "#000000",
    charLimit: 280,
    supportsMedia: true,
    fields: [
      { key: "bearer_token", label: "Bearer Token (OAuth 2.0)", secret: true, required: true },
      { key: "api_key", label: "API Key (optional, for media)", secret: true },
      { key: "api_secret", label: "API Secret (optional, for media)", secret: true },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    charLimit: 3000,
    supportsMedia: true,
    fields: [
      { key: "access_token", label: "Access Token", secret: true, required: true },
      { key: "organization_urn", label: "Organization URN (e.g. urn:li:organization:123)", required: true },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#010101",
    charLimit: 2200,
    supportsMedia: true,
    fields: [
      { key: "access_token", label: "Access Token", secret: true, required: true },
      { key: "open_id", label: "Open ID", required: true },
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    charLimit: 5000,
    supportsMedia: true,
    fields: [
      { key: "api_key", label: "API Key", secret: true, required: true },
      { key: "access_token", label: "OAuth Access Token", secret: true },
      { key: "channel_id", label: "Channel ID" },
    ],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    color: "#BD081C",
    charLimit: 500,
    supportsMedia: true,
    fields: [
      { key: "access_token", label: "Access Token", secret: true, required: true },
      { key: "board_id", label: "Board ID", required: true },
    ],
  },
  {
    id: "threads",
    name: "Threads",
    color: "#000000",
    charLimit: 500,
    supportsMedia: true,
    fields: [
      { key: "access_token", label: "Access Token (Meta)", secret: true, required: true },
      { key: "threads_user_id", label: "Threads User ID", required: true },
    ],
  },
];

export const SOCIAL_PLATFORM_MAP = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.id, p])
) as Record<SocialPlatform, SocialPlatformDefinition>;

export const SOCIAL_PLATFORM_LABELS = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.id, p.name])
) as Record<SocialPlatform, string>;

export function getMinCharLimit(platforms: SocialPlatform[]): number {
  if (platforms.length === 0) return 5000;
  return Math.min(...platforms.map((p) => SOCIAL_PLATFORM_MAP[p].charLimit));
}
