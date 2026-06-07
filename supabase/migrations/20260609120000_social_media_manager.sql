-- Social media manager: channel credentials + scheduled posts

CREATE TABLE IF NOT EXISTS public.social_channel_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL UNIQUE
    CHECK (platform IN (
      'instagram', 'facebook', 'x', 'linkedin',
      'tiktok', 'youtube', 'pinterest', 'threads'
    )),
  label text,
  credentials jsonb NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  media_urls jsonb NOT NULL DEFAULT '[]',
  platforms text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'partial', 'failed', 'cancelled')),
  scheduled_at timestamptz,
  published_at timestamptz,
  platform_results jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_posts_created_at_idx
  ON public.social_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS social_posts_scheduled_idx
  ON public.social_posts (status, scheduled_at)
  WHERE status = 'scheduled';

ALTER TABLE public.social_channel_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage social_channel_credentials" ON public.social_channel_credentials;
CREATE POLICY "Admins manage social_channel_credentials" ON public.social_channel_credentials
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage social_posts" ON public.social_posts;
CREATE POLICY "Admins manage social_posts" ON public.social_posts
  FOR ALL USING (public.is_admin());

-- Storage bucket for social post media
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media', 'social-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read social media" ON storage.objects;
CREATE POLICY "Public read social media" ON storage.objects
  FOR SELECT USING (bucket_id = 'social-media');

DROP POLICY IF EXISTS "Admins upload social media" ON storage.objects;
CREATE POLICY "Admins upload social media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'social-media' AND public.is_admin());

DROP POLICY IF EXISTS "Admins manage social media" ON storage.objects;
CREATE POLICY "Admins manage social media" ON storage.objects
  FOR ALL USING (bucket_id = 'social-media' AND public.is_admin());
