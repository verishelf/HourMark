-- Crownly Stories: content platform schema

-- ============ STORY CATEGORIES ============
CREATE TABLE IF NOT EXISTS public.story_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.story_categories (slug, name, description, sort_order) VALUES
  ('success-stories', 'Success Stories', 'Journeys of achievement and milestone moments', 1),
  ('deal-room-stories', 'Deal Room Stories', 'Business deals born from watch culture', 2),
  ('collector-spotlights', 'Collector Spotlights', 'Profiles of passionate collectors', 3),
  ('founder-interviews', 'Founder Interviews', 'Conversations with entrepreneurs and founders', 4),
  ('watch-and-wealth', 'Watch & Wealth', 'Horology, investment, and wealth building', 5),
  ('networking-wins', 'Networking Wins', 'Connections that changed careers and businesses', 6),
  ('celebrity-collections', 'Celebrity Collections', 'Notable figures and their timepieces', 7),
  ('industry-leaders', 'Industry Leaders', 'Insights from watch industry executives', 8),
  ('luxury-lifestyle', 'Luxury Lifestyle', 'Culture, travel, and the luxury life', 9),
  ('investment-insights', 'Investment Insights', 'Market analysis and collecting strategy', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============ AUTHORS ============
CREATE TABLE IF NOT EXISTS public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  bio text,
  title text,
  social_links jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ STORIES ============
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  hero_image_url text NOT NULL,
  body jsonb NOT NULL DEFAULT '[]',
  category_id uuid NOT NULL REFERENCES public.story_categories(id),
  author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL,
  read_time_minutes integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  published_at timestamptz,
  scheduled_at timestamptz,
  is_featured boolean NOT NULL DEFAULT false,
  source_attribution text,
  related_listing_ids uuid[] NOT NULL DEFAULT '{}',
  submitted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  view_count integer NOT NULL DEFAULT 0,
  like_count integer NOT NULL DEFAULT 0,
  bookmark_count integer NOT NULL DEFAULT 0,
  share_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stories_status_published_at_idx
  ON public.stories (status, published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS stories_category_id_idx ON public.stories (category_id);
CREATE INDEX IF NOT EXISTS stories_is_featured_idx ON public.stories (is_featured) WHERE is_featured = true;

-- ============ STORY SUBMISSIONS ============
CREATE TABLE IF NOT EXISTS public.story_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  watch_reference text,
  business_lesson text,
  networking_lesson text,
  photo_urls text[] NOT NULL DEFAULT '{}',
  social_links jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes text,
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_submissions_status_idx ON public.story_submissions (status);

-- ============ ENGAGEMENT ============
CREATE TABLE IF NOT EXISTS public.story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.story_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  parent_id uuid REFERENCES public.story_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_comments_story_id_idx ON public.story_comments (story_id, created_at);

CREATE TABLE IF NOT EXISTS public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  session_id text,
  scroll_depth_pct integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS story_views_story_id_idx ON public.story_views (story_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.story_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'native'
    CHECK (channel IN ('native', 'link', 'web')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS public.celebrity_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  avatar_url text,
  bio text,
  watch_collection jsonb NOT NULL DEFAULT '[]',
  business_ventures jsonb NOT NULL DEFAULT '[]',
  career_highlights jsonb NOT NULL DEFAULT '[]',
  networking_lessons text,
  favorite_quote text,
  source_urls text[] NOT NULL DEFAULT '{}',
  author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collector_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  bio text,
  watch_collection jsonb NOT NULL DEFAULT '[]',
  business_ventures jsonb NOT NULL DEFAULT '[]',
  featured_story_ids uuid[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============ USER INTERESTS (Crownly Connect) ============
CREATE TABLE IF NOT EXISTS public.user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  interest text NOT NULL
    CHECK (interest IN (
      'real_estate', 'startups', 'technology', 'investing', 'e_commerce',
      'watches', 'luxury_goods', 'marketing', 'finance'
    )),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, interest)
);

-- ============ FEATURED STORIES ============
CREATE TABLE IF NOT EXISTS public.featured_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  placement text NOT NULL DEFAULT 'home'
    CHECK (placement IN ('home', 'feed_top', 'category')),
  sort_order integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS featured_stories_placement_idx ON public.featured_stories (placement, sort_order);

-- ============ ENGAGEMENT COUNT TRIGGERS ============
CREATE OR REPLACE FUNCTION public.sync_story_like_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories SET like_count = like_count + 1, updated_at = now() WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories SET like_count = GREATEST(like_count - 1, 0), updated_at = now() WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS story_likes_count_trigger ON public.story_likes;
CREATE TRIGGER story_likes_count_trigger
  AFTER INSERT OR DELETE ON public.story_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_like_count();

CREATE OR REPLACE FUNCTION public.sync_story_bookmark_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories SET bookmark_count = bookmark_count + 1, updated_at = now() WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories SET bookmark_count = GREATEST(bookmark_count - 1, 0), updated_at = now() WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS story_bookmarks_count_trigger ON public.story_bookmarks;
CREATE TRIGGER story_bookmarks_count_trigger
  AFTER INSERT OR DELETE ON public.story_bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_bookmark_count();

CREATE OR REPLACE FUNCTION public.sync_story_comment_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories SET comment_count = comment_count + 1, updated_at = now() WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories SET comment_count = GREATEST(comment_count - 1, 0), updated_at = now() WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS story_comments_count_trigger ON public.story_comments;
CREATE TRIGGER story_comments_count_trigger
  AFTER INSERT OR DELETE ON public.story_comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_comment_count();

CREATE OR REPLACE FUNCTION public.sync_story_share_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.stories SET share_count = share_count + 1, updated_at = now() WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS story_shares_count_trigger ON public.story_shares;
CREATE TRIGGER story_shares_count_trigger
  AFTER INSERT ON public.story_shares
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_share_count();

CREATE OR REPLACE FUNCTION public.sync_story_view_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.stories SET view_count = view_count + 1, updated_at = now() WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS story_views_count_trigger ON public.story_views;
CREATE TRIGGER story_views_count_trigger
  AFTER INSERT ON public.story_views
  FOR EACH ROW EXECUTE FUNCTION public.sync_story_view_count();

-- ============ RECOMMENDATION RPCs ============
CREATE OR REPLACE FUNCTION public.story_engagement_score(
  p_view_count integer,
  p_like_count integer,
  p_bookmark_count integer,
  p_share_count integer,
  p_published_at timestamptz
)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  SELECT (
    COALESCE(p_view_count, 0) * 1.0
    + COALESCE(p_like_count, 0) * 3.0
    + COALESCE(p_bookmark_count, 0) * 2.0
    + COALESCE(p_share_count, 0) * 4.0
  ) / GREATEST(1.0, EXTRACT(EPOCH FROM (now() - COALESCE(p_published_at, now()))) / 86400.0 + 1.0);
$$;

CREATE OR REPLACE FUNCTION public.get_trending_stories(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
RETURNS SETOF public.stories
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.*
  FROM public.stories s
  WHERE s.status = 'published'
  ORDER BY public.story_engagement_score(s.view_count, s.like_count, s.bookmark_count, s.share_count, s.published_at) DESC,
           s.published_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
$$;

CREATE OR REPLACE FUNCTION public.get_recommended_stories(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS SETOF public.stories
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH user_cats AS (
    SELECT DISTINCT sc.slug
    FROM public.user_interests ui
    JOIN public.story_categories sc ON (
      (ui.interest = 'watches' AND sc.slug IN ('collector-spotlights', 'watch-and-wealth', 'investment-insights'))
      OR (ui.interest = 'investing' AND sc.slug IN ('investment-insights', 'watch-and-wealth'))
      OR (ui.interest = 'startups' AND sc.slug IN ('founder-interviews', 'success-stories', 'networking-wins'))
      OR (ui.interest = 'real_estate' AND sc.slug IN ('luxury-lifestyle', 'watch-and-wealth'))
      OR (ui.interest = 'technology' AND sc.slug IN ('founder-interviews', 'industry-leaders'))
      OR (ui.interest = 'e_commerce' AND sc.slug IN ('deal-room-stories', 'success-stories'))
      OR (ui.interest = 'luxury_goods' AND sc.slug IN ('luxury-lifestyle', 'celebrity-collections'))
      OR (ui.interest = 'marketing' AND sc.slug IN ('networking-wins', 'success-stories'))
      OR (ui.interest = 'finance' AND sc.slug IN ('investment-insights', 'watch-and-wealth'))
    )
    WHERE ui.user_id = p_user_id
  ),
  engaged_cats AS (
    SELECT DISTINCT sc.slug
    FROM public.story_likes sl
    JOIN public.stories s ON s.id = sl.story_id
    JOIN public.story_categories sc ON sc.id = s.category_id
    WHERE sl.user_id = p_user_id
    UNION
    SELECT DISTINCT sc.slug
    FROM public.story_bookmarks sb
    JOIN public.stories s ON s.id = sb.story_id
    JOIN public.story_categories sc ON sc.id = s.category_id
    WHERE sb.user_id = p_user_id
  ),
  scored AS (
    SELECT
      s.*,
      public.story_engagement_score(s.view_count, s.like_count, s.bookmark_count, s.share_count, s.published_at)
      + CASE WHEN uc.slug IS NOT NULL THEN 3 ELSE 0 END
      + CASE WHEN ec.slug IS NOT NULL THEN 2 ELSE 0 END
      AS rec_score
    FROM public.stories s
    JOIN public.story_categories sc ON sc.id = s.category_id
    LEFT JOIN user_cats uc ON uc.slug = sc.slug
    LEFT JOIN engaged_cats ec ON ec.slug = sc.slug
    WHERE s.status = 'published'
  )
  SELECT
    id, slug, title, subtitle, hero_image_url, body, category_id, author_id,
    read_time_minutes, status, published_at, scheduled_at, is_featured,
    source_attribution, related_listing_ids, submitted_by,
    view_count, like_count, bookmark_count, share_count, comment_count,
    created_at, updated_at
  FROM scored
  ORDER BY rec_score DESC, published_at DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_stories(integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommended_stories(uuid, integer, integer) TO authenticated;

-- ============ RLS ============
ALTER TABLE public.story_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.celebrity_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Story categories are public" ON public.story_categories;
CREATE POLICY "Story categories are public" ON public.story_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authors are public" ON public.authors;
CREATE POLICY "Authors are public" ON public.authors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Published stories are public" ON public.stories;
CREATE POLICY "Published stories are public" ON public.stories FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Admins manage stories" ON public.stories;
CREATE POLICY "Admins manage stories" ON public.stories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Users manage own story likes" ON public.story_likes;
CREATE POLICY "Users manage own story likes" ON public.story_likes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Story likes are public" ON public.story_likes;
CREATE POLICY "Story likes are public" ON public.story_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage own story bookmarks" ON public.story_bookmarks;
CREATE POLICY "Users manage own story bookmarks" ON public.story_bookmarks FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own story comments" ON public.story_comments;
CREATE POLICY "Users manage own story comments" ON public.story_comments FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Story comments are public" ON public.story_comments;
CREATE POLICY "Story comments are public" ON public.story_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert story views" ON public.story_views;
CREATE POLICY "Anyone can insert story views" ON public.story_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own story views" ON public.story_views;
CREATE POLICY "Users update own story views" ON public.story_views FOR UPDATE
  USING (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert story shares" ON public.story_shares;
CREATE POLICY "Anyone can insert story shares" ON public.story_shares FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users manage own interests" ON public.user_interests;
CREATE POLICY "Users manage own interests" ON public.user_interests FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own submissions" ON public.story_submissions;
CREATE POLICY "Users create own submissions" ON public.story_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own submissions" ON public.story_submissions;
CREATE POLICY "Users read own submissions" ON public.story_submissions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage submissions" ON public.story_submissions;
CREATE POLICY "Admins manage submissions" ON public.story_submissions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Published celebrity profiles are public" ON public.celebrity_profiles;
CREATE POLICY "Published celebrity profiles are public" ON public.celebrity_profiles FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins manage celebrity profiles" ON public.celebrity_profiles;
CREATE POLICY "Admins manage celebrity profiles" ON public.celebrity_profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Published collector profiles are public" ON public.collector_profiles;
CREATE POLICY "Published collector profiles are public" ON public.collector_profiles FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Users read own collector profile" ON public.collector_profiles;
CREATE POLICY "Users read own collector profile" ON public.collector_profiles FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage collector profiles" ON public.collector_profiles;
CREATE POLICY "Admins manage collector profiles" ON public.collector_profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Featured stories are public" ON public.featured_stories;
CREATE POLICY "Featured stories are public" ON public.featured_stories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage featured stories" ON public.featured_stories;
CREATE POLICY "Admins manage featured stories" ON public.featured_stories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage authors" ON public.authors;
CREATE POLICY "Admins manage authors" ON public.authors FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage categories" ON public.story_categories;
CREATE POLICY "Admins manage categories" ON public.story_categories FOR ALL USING (public.is_admin());

-- ============ STORAGE ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-images', 'story-images', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view story images" ON storage.objects;
CREATE POLICY "Anyone can view story images" ON storage.objects FOR SELECT
  USING (bucket_id = 'story-images');

DROP POLICY IF EXISTS "Authenticated users upload story images" ON storage.objects;
CREATE POLICY "Authenticated users upload story images" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'story-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own story images" ON storage.objects;
CREATE POLICY "Users delete own story images" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'story-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
