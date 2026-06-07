export type StoryStatus = "draft" | "scheduled" | "published" | "archived";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type UserInterest =
  | "real_estate"
  | "startups"
  | "technology"
  | "investing"
  | "e_commerce"
  | "watches"
  | "luxury_goods"
  | "marketing"
  | "finance";

export type StoryBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string; level: 2 | 3 }
  | { type: "pull_quote"; text: string; attribution?: string }
  | { type: "image"; url: string; caption?: string };

export type StoryCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
};

export type Author = {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  title: string | null;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type Story = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image_url: string;
  body: StoryBlock[];
  category_id: string;
  author_id: string | null;
  read_time_minutes: number;
  status: StoryStatus;
  published_at: string | null;
  scheduled_at: string | null;
  is_featured: boolean;
  source_attribution: string | null;
  related_listing_ids: string[];
  submitted_by: string | null;
  view_count: number;
  like_count: number;
  bookmark_count: number;
  share_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  category?: StoryCategory;
  author?: Author;
};

export type StorySubmission = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  watch_reference: string | null;
  business_lesson: string | null;
  networking_lesson: string | null;
  photo_urls: string[];
  social_links: Record<string, string>;
  status: SubmissionStatus;
  reviewer_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  story_id: string | null;
  created_at: string;
  updated_at: string;
  user?: { username: string | null; full_name: string | null; avatar_url: string | null };
};

export type WatchCollectionItem = {
  brand: string;
  model: string;
  reference?: string;
  notes?: string;
  image_url?: string;
};

export type BusinessVenture = {
  name: string;
  role?: string;
  description?: string;
};

export type CareerHighlight = {
  title: string;
  year?: string;
  description?: string;
};

export type CelebrityProfile = {
  id: string;
  slug: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  watch_collection: WatchCollectionItem[];
  business_ventures: BusinessVenture[];
  career_highlights: CareerHighlight[];
  networking_lessons: string | null;
  favorite_quote: string | null;
  source_urls: string[];
  author_id: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type CollectorProfile = {
  id: string;
  user_id: string;
  slug: string;
  bio: string | null;
  watch_collection: WatchCollectionItem[];
  business_ventures: BusinessVenture[];
  featured_story_ids: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
  user?: { username: string | null; full_name: string | null; avatar_url: string | null };
};

export type StoryAnalytics = {
  total_views: number;
  total_reads: number;
  completion_rate: number;
  total_shares: number;
  total_saves: number;
  total_likes: number;
  trending: { slug: string; title: string; view_count: number; engagement_score: number }[];
};
