-- Admin push notification campaigns

CREATE TABLE IF NOT EXISTS public.push_notification_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all'
    CHECK (audience IN ('sellers', 'buyers', 'dealers', 'new_leads', 'web_signups', 'all')),
  deep_link text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_notification_campaigns_created_at_idx
  ON public.push_notification_campaigns (created_at DESC);

ALTER TABLE public.push_notification_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage push_notification_campaigns" ON public.push_notification_campaigns;
CREATE POLICY "Admins manage push_notification_campaigns" ON public.push_notification_campaigns
  FOR ALL USING (public.is_admin());

-- Allow admins to read push tokens for campaign delivery (service role used in practice)
DROP POLICY IF EXISTS "Admins read push tokens" ON public.push_tokens;
CREATE POLICY "Admins read push tokens" ON public.push_tokens
  FOR SELECT USING (public.is_admin());
