-- Website waitlist / email capture signups
CREATE TABLE IF NOT EXISTS public.website_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text NOT NULL DEFAULT 'website',
  subscribed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT website_signups_email_unique UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS website_signups_subscribed_created_idx
  ON public.website_signups (subscribed, created_at DESC);

ALTER TABLE public.website_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage website_signups" ON public.website_signups
  FOR ALL USING (public.is_admin());

-- Allow web_signups as a campaign audience
ALTER TABLE public.email_campaigns DROP CONSTRAINT IF EXISTS email_campaigns_audience_check;
ALTER TABLE public.email_campaigns ADD CONSTRAINT email_campaigns_audience_check
  CHECK (audience IN ('sellers', 'buyers', 'dealers', 'new_leads', 'web_signups', 'all'));
