export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "x"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "threads";

export type SocialPostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "partial"
  | "failed"
  | "cancelled";

export type SocialPlatformResult = {
  success: boolean;
  external_id?: string;
  url?: string;
  error?: string;
  published_at?: string;
};

export type SocialChannelCredentials = {
  id: string;
  platform: SocialPlatform;
  label: string | null;
  credentials: Record<string, string>;
  enabled: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialPost = {
  id: string;
  content: string;
  media_urls: string[];
  platforms: SocialPlatform[];
  status: SocialPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  platform_results: Partial<Record<SocialPlatform, SocialPlatformResult>>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SocialCredentialField = {
  key: string;
  label: string;
  placeholder?: string;
  secret?: boolean;
  required?: boolean;
};

export type SocialPlatformDefinition = {
  id: SocialPlatform;
  name: string;
  color: string;
  fields: SocialCredentialField[];
  charLimit: number;
  supportsMedia: boolean;
};
