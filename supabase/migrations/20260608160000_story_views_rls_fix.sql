-- Fix story_views RLS: allow insert+select return and progress updates

DROP POLICY IF EXISTS "Anyone can insert story views" ON public.story_views;
CREATE POLICY "Anyone can insert story views" ON public.story_views
  FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own story views" ON public.story_views;
CREATE POLICY "Users update own story views" ON public.story_views
  FOR UPDATE
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own story views" ON public.story_views;
CREATE POLICY "Users read own story views" ON public.story_views
  FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

-- Admin uploads to story-images bucket
DROP POLICY IF EXISTS "Admins upload story images" ON storage.objects;
CREATE POLICY "Admins upload story images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'story-images'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins manage story images" ON storage.objects;
CREATE POLICY "Admins manage story images" ON storage.objects
  FOR ALL
  USING (bucket_id = 'story-images' AND public.is_admin());
