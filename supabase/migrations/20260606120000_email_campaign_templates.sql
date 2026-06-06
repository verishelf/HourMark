-- Saved HTML templates for email campaigns
CREATE TABLE IF NOT EXISTS public.email_campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  default_subject text NOT NULL DEFAULT '',
  html text NOT NULL DEFAULT '',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email_campaign_templates" ON public.email_campaign_templates
  FOR ALL USING (public.is_admin());

ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.email_campaign_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS email_campaign_templates_created_at_idx
  ON public.email_campaign_templates (created_at DESC);
