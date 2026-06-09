-- Crownly Dealer CRM & Growth Engine
-- Enterprise dealer acquisition, pipeline, launch partners, activities, tasks, audit

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Core dealer CRM record
CREATE TABLE IF NOT EXISTS public.dealers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  instagram text,
  city text,
  country text,
  inventory_value bigint NOT NULL DEFAULT 0,
  estimated_monthly_sales bigint NOT NULL DEFAULT 0,
  watch_count integer NOT NULL DEFAULT 0,
  instagram_followers integer NOT NULL DEFAULT 0,
  lead_score integer NOT NULL DEFAULT 0,
  lead_grade text NOT NULL DEFAULT 'C'
    CHECK (lead_grade IN ('A+', 'A', 'B', 'C')),
  commission_rate numeric(5,2) NOT NULL DEFAULT 7.00,
  default_commission_rate numeric(5,2) NOT NULL DEFAULT 7.00,
  is_launch_partner boolean NOT NULL DEFAULT false,
  launch_partner_start timestamptz,
  launch_partner_expires timestamptz,
  pipeline_status text NOT NULL DEFAULT 'new_lead'
    CHECK (pipeline_status IN (
      'new_lead', 'contacted', 'interested', 'demo_scheduled',
      'proposal_sent', 'account_created', 'inventory_imported',
      'active_seller', 'top_seller'
    )),
  notes text,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS dealers_email_unique ON public.dealers (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS dealers_website_unique ON public.dealers (lower(website)) WHERE website IS NOT NULL AND website <> '';
CREATE UNIQUE INDEX IF NOT EXISTS dealers_instagram_unique ON public.dealers (lower(instagram)) WHERE instagram IS NOT NULL AND instagram <> '';
CREATE INDEX IF NOT EXISTS dealers_pipeline_status_idx ON public.dealers (pipeline_status);
CREATE INDEX IF NOT EXISTS dealers_lead_grade_idx ON public.dealers (lead_grade);
CREATE INDEX IF NOT EXISTS dealers_country_idx ON public.dealers (country);
CREATE INDEX IF NOT EXISTS dealers_city_idx ON public.dealers (city);
CREATE INDEX IF NOT EXISTS dealers_created_at_idx ON public.dealers (created_at DESC);
CREATE INDEX IF NOT EXISTS dealers_user_id_idx ON public.dealers (user_id);
CREATE INDEX IF NOT EXISTS dealers_launch_partner_expires_idx ON public.dealers (launch_partner_expires) WHERE is_launch_partner = true;
CREATE INDEX IF NOT EXISTS dealers_company_name_trgm ON public.dealers USING gin (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS dealers_contact_name_trgm ON public.dealers USING gin (contact_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS dealers_email_trgm ON public.dealers USING gin (email gin_trgm_ops);

-- Outreach activity timeline
CREATE TABLE IF NOT EXISTS public.dealer_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  activity_type text NOT NULL
    CHECK (activity_type IN (
      'email', 'instagram_dm', 'whatsapp', 'phone_call', 'meeting',
      'proposal_sent', 'account_created', 'inventory_imported'
    )),
  notes text,
  outcome text,
  next_follow_up_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dealer_activities_dealer_created_idx
  ON public.dealer_activities (dealer_id, created_at DESC);

-- Task management
CREATE TABLE IF NOT EXISTS public.dealer_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  title text NOT NULL,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dealer_tasks_dealer_idx ON public.dealer_tasks (dealer_id);
CREATE INDEX IF NOT EXISTS dealer_tasks_due_at_idx ON public.dealer_tasks (due_at) WHERE status <> 'done';
CREATE INDEX IF NOT EXISTS dealer_tasks_assigned_idx ON public.dealer_tasks (assigned_to);

-- Field-level audit changelog
CREATE TABLE IF NOT EXISTS public.dealer_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.users(id),
  field_name text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dealer_changelog_dealer_idx ON public.dealer_changelog (dealer_id, created_at DESC);

-- Lead scoring computation
CREATE OR REPLACE FUNCTION public.compute_dealer_lead_score(
  p_inventory_value bigint,
  p_instagram_followers integer,
  p_city text,
  p_country text
)
RETURNS TABLE(score integer, grade text)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_score integer := 0;
  v_location text;
BEGIN
  -- Inventory value (highest tier only)
  IF p_inventory_value >= 500000000 THEN
    v_score := v_score + 100;
  ELSIF p_inventory_value >= 100000000 THEN
    v_score := v_score + 50;
  ELSIF p_inventory_value >= 50000000 THEN
    v_score := v_score + 25;
  ELSIF p_inventory_value >= 10000000 THEN
    v_score := v_score + 10;
  END IF;

  -- Social media (highest tier only)
  IF p_instagram_followers >= 100000 THEN
    v_score := v_score + 40;
  ELSIF p_instagram_followers >= 10000 THEN
    v_score := v_score + 15;
  ELSIF p_instagram_followers >= 1000 THEN
    v_score := v_score + 5;
  END IF;

  -- Market score
  v_location := lower(trim(coalesce(p_city, '') || ' ' || coalesce(p_country, '')));
  IF v_location LIKE '%dubai%' OR lower(coalesce(p_country, '')) = 'uae' THEN
    v_score := v_score + 25;
  ELSIF v_location LIKE '%miami%' OR v_location LIKE '%new york%' OR v_location LIKE '%london%'
    OR lower(coalesce(p_city, '')) IN ('miami', 'new york', 'london')
    OR lower(coalesce(p_country, '')) IN ('united states', 'usa', 'us', 'uk', 'united kingdom') THEN
    IF v_location LIKE '%miami%' OR lower(coalesce(p_city, '')) = 'miami' THEN
      v_score := v_score + 20;
    ELSIF v_location LIKE '%new york%' OR lower(coalesce(p_city, '')) IN ('new york', 'nyc') THEN
      v_score := v_score + 20;
    ELSIF v_location LIKE '%london%' OR lower(coalesce(p_city, '')) = 'london' THEN
      v_score := v_score + 20;
    END IF;
  ELSIF v_location LIKE '%los angeles%' OR v_location LIKE '%singapore%' OR v_location LIKE '%hong kong%'
    OR lower(coalesce(p_city, '')) IN ('los angeles', 'singapore', 'hong kong') THEN
    v_score := v_score + 15;
  END IF;

  score := v_score;
  IF v_score >= 80 THEN
    grade := 'A+';
  ELSIF v_score >= 60 THEN
    grade := 'A';
  ELSIF v_score >= 35 THEN
    grade := 'B';
  ELSE
    grade := 'C';
  END IF;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.dealers_recompute_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  r record;
BEGIN
  SELECT * INTO r FROM public.compute_dealer_lead_score(
    NEW.inventory_value,
    NEW.instagram_followers,
    NEW.city,
    NEW.country
  );
  NEW.lead_score := r.score;
  NEW.lead_grade := r.grade;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dealers_recompute_score_trigger ON public.dealers;
CREATE TRIGGER dealers_recompute_score_trigger
  BEFORE INSERT OR UPDATE OF inventory_value, instagram_followers, city, country
  ON public.dealers
  FOR EACH ROW EXECUTE FUNCTION public.dealers_recompute_score();

CREATE OR REPLACE FUNCTION public.dealers_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dealers_updated_at_trigger ON public.dealers;
CREATE TRIGGER dealers_updated_at_trigger
  BEFORE UPDATE ON public.dealers
  FOR EACH ROW EXECUTE FUNCTION public.dealers_set_updated_at();

-- Expire launch partners past expiration date
CREATE OR REPLACE FUNCTION public.expire_launch_partners()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.dealers
  SET
    is_launch_partner = false,
    commission_rate = default_commission_rate,
    updated_at = now()
  WHERE is_launch_partner = true
    AND launch_partner_expires IS NOT NULL
    AND launch_partner_expires < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Effective seller fee rate (0% for active launch partners)
CREATE OR REPLACE FUNCTION public.get_effective_seller_fee_rate(p_seller_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dealer record;
  v_platform_rate numeric;
BEGIN
  PERFORM public.expire_launch_partners();

  SELECT * INTO v_dealer
  FROM public.dealers
  WHERE user_id = p_seller_user_id
    AND is_launch_partner = true
    AND launch_partner_expires IS NOT NULL
    AND launch_partner_expires > now()
  LIMIT 1;

  IF FOUND THEN
    RETURN 0;
  END IF;

  SELECT seller_fee_percentage INTO v_platform_rate
  FROM public.platform_settings
  LIMIT 1;

  IF v_platform_rate IS NOT NULL THEN
    RETURN v_platform_rate;
  END IF;

  RETURN 7.00;
END;
$$;

-- RLS
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_changelog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage dealers" ON public.dealers
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins manage dealer_activities" ON public.dealer_activities
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins manage dealer_tasks" ON public.dealer_tasks
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins manage dealer_changelog" ON public.dealer_changelog
  FOR ALL USING (public.is_admin());
