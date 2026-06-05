-- Crownly Admin Dashboard schema
-- Adds admin roles, admin-specific tables, and RLS policies

-- Admin role on users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS admin_role text
    CHECK (admin_role IN ('super_admin', 'support_admin', 'auth_inspector', 'finance_admin')),
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false;

-- Featured flag on listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Seller leads CRM
CREATE TABLE IF NOT EXISTS public.seller_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  watch_brand text NOT NULL,
  model text NOT NULL,
  estimated_value integer,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'interested', 'negotiating', 'seller_onboarded', 'closed')),
  notes text,
  assigned_to uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Authentication requests queue
CREATE TABLE IF NOT EXISTS public.authentication_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings(id),
  seller_id uuid NOT NULL REFERENCES public.users(id),
  buyer_id uuid REFERENCES public.users(id),
  watch_brand text NOT NULL,
  watch_model text NOT NULL,
  tracking_number text,
  status text NOT NULL DEFAULT 'awaiting_shipment'
    CHECK (status IN ('awaiting_shipment', 'received', 'under_inspection', 'passed', 'failed', 'returned', 'delivered')),
  inspection_notes text,
  inspection_photos text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  subject text NOT NULL,
  body text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Admin notifications (separate from user notifications)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  body text,
  data jsonb NOT NULL DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Email campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  template_html text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT 'all'
    CHECK (audience IN ('sellers', 'buyers', 'dealers', 'new_leads', 'all')),
  audience_filters jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  open_count integer NOT NULL DEFAULT 0,
  click_count integer NOT NULL DEFAULT 0,
  reply_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Platform settings (singleton)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_percentage numeric(5,2) NOT NULL DEFAULT 5.00,
  seller_fee_percentage numeric(5,2) NOT NULL DEFAULT 0.00,
  buyer_fee_percentage numeric(5,2) NOT NULL DEFAULT 0.00,
  email_templates jsonb NOT NULL DEFAULT '{}',
  authentication_rules jsonb NOT NULL DEFAULT '{}',
  platform_settings jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND admin_role IS NOT NULL
      AND suspended = false
  );
$$;

-- RLS policies for admin tables
ALTER TABLE public.seller_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authentication_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage seller_leads" ON public.seller_leads
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins manage authentication_requests" ON public.authentication_requests
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins manage support_tickets" ON public.support_tickets
  FOR ALL USING (public.is_admin());

CREATE POLICY "Users create support tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage admin_notifications" ON public.admin_notifications
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins manage audit_logs" ON public.audit_logs
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins manage email_campaigns" ON public.email_campaigns
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins manage platform_settings" ON public.platform_settings
  FOR ALL USING (public.is_admin());

-- Admin notification triggers
CREATE OR REPLACE FUNCTION public.notify_admin_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.authentication_status = 'manual_review' THEN
    INSERT INTO public.admin_notifications (type, title, body, data)
    VALUES ('new_listing', 'New Listing Pending Review',
      NEW.brand || ' ' || NEW.model,
      jsonb_build_object('listing_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_listing_admin_notify ON public.listings;
CREATE TRIGGER on_listing_admin_notify
  AFTER INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_listing();

CREATE OR REPLACE FUNCTION public.notify_admin_new_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'completed') THEN
    INSERT INTO public.admin_notifications (type, title, body, data)
    VALUES ('new_sale', 'Sale Completed',
      'Order ' || LEFT(NEW.id::text, 8),
      jsonb_build_object('order_id', NEW.id, 'amount', NEW.amount));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_admin_notify ON public.orders;
CREATE TRIGGER on_order_admin_notify
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_sale();

-- Seed default platform settings
INSERT INTO public.platform_settings (commission_percentage)
SELECT 5.00
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings LIMIT 1);
