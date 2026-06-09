-- Shopify integration for dealer inventory sync

-- OAuth CSRF state (short-lived)
CREATE TABLE IF NOT EXISTS public.shopify_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_domain text NOT NULL,
  state_token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shopify_oauth_states_user_idx ON public.shopify_oauth_states (user_id);
CREATE INDEX IF NOT EXISTS shopify_oauth_states_expires_idx ON public.shopify_oauth_states (expires_at);

-- Connected Shopify stores (one per dealer)
CREATE TABLE IF NOT EXISTS public.dealer_shopify_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_domain text NOT NULL,
  shop_name text,
  access_token_encrypted text NOT NULL,
  scopes text NOT NULL DEFAULT '',
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_sync timestamptz,
  sync_status text NOT NULL DEFAULT 'idle'
    CHECK (sync_status IN ('idle', 'syncing', 'success', 'error', 'disabled')),
  products_imported integer NOT NULL DEFAULT 0,
  integration_enabled boolean NOT NULL DEFAULT true,
  webhook_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  seller_fee_rate numeric(5,4) NOT NULL DEFAULT 0.0700,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_domain),
  UNIQUE (dealer_id)
);

CREATE INDEX IF NOT EXISTS dealer_shopify_stores_user_idx ON public.dealer_shopify_stores (user_id);
CREATE INDEX IF NOT EXISTS dealer_shopify_stores_sync_status_idx ON public.dealer_shopify_stores (sync_status);
CREATE INDEX IF NOT EXISTS dealer_shopify_stores_last_sync_idx ON public.dealer_shopify_stores (last_sync DESC);

-- Sync activity logs
CREATE TABLE IF NOT EXISTS public.shopify_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.dealer_shopify_stores(id) ON DELETE SET NULL,
  sync_type text NOT NULL
    CHECK (sync_type IN ('initial_import', 'manual', 'webhook', 'scheduled', 'admin_force')),
  status text NOT NULL
    CHECK (status IN ('started', 'success', 'partial', 'failed')),
  products_created integer NOT NULL DEFAULT 0,
  products_updated integer NOT NULL DEFAULT 0,
  products_deleted integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS shopify_sync_logs_dealer_idx ON public.shopify_sync_logs (dealer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS shopify_sync_logs_store_idx ON public.shopify_sync_logs (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS shopify_sync_logs_status_idx ON public.shopify_sync_logs (status, created_at DESC);

-- Link listings to Shopify products
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS external_source text NOT NULL DEFAULT 'manual'
    CHECK (external_source IN ('manual', 'shopify')),
  ADD COLUMN IF NOT EXISTS shopify_product_id text,
  ADD COLUMN IF NOT EXISTS shopify_variant_id text,
  ADD COLUMN IF NOT EXISTS shopify_sku text,
  ADD COLUMN IF NOT EXISTS inventory_quantity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS import_seller_fee_rate numeric(5,4);

CREATE UNIQUE INDEX IF NOT EXISTS listings_shopify_product_unique
  ON public.listings (seller_id, shopify_product_id)
  WHERE shopify_product_id IS NOT NULL AND external_source = 'shopify';

CREATE INDEX IF NOT EXISTS listings_shopify_variant_idx
  ON public.listings (shopify_variant_id)
  WHERE shopify_variant_id IS NOT NULL;

-- Resolve dealer for a seller user (create minimal record if missing)
CREATE OR REPLACE FUNCTION public.ensure_dealer_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dealer_id uuid;
  v_email text;
  v_name text;
BEGIN
  SELECT id INTO v_dealer_id
  FROM public.dealers
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_dealer_id IS NOT NULL THEN
    RETURN v_dealer_id;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  SELECT COALESCE(full_name, username, 'Crownly Seller') INTO v_name
  FROM public.users WHERE id = p_user_id;

  INSERT INTO public.dealers (
    company_name,
    contact_name,
    email,
    user_id,
    pipeline_status
  )
  VALUES (
    v_name,
    v_name,
    COALESCE(v_email, p_user_id::text || '@crownly.app'),
    p_user_id,
    'account_created'
  )
  RETURNING id INTO v_dealer_id;

  RETURN v_dealer_id;
END;
$$;

-- RLS: sellers read own store metadata (no token); admins read all
ALTER TABLE public.dealer_shopify_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopify_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers view own shopify store"
  ON public.dealer_shopify_stores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage shopify stores"
  ON public.dealer_shopify_stores FOR ALL
  USING (public.is_admin());

CREATE POLICY "Sellers view own sync logs"
  ON public.shopify_sync_logs FOR SELECT
  USING (
    dealer_id IN (SELECT id FROM public.dealers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins view all sync logs"
  ON public.shopify_sync_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins manage sync logs"
  ON public.shopify_sync_logs FOR ALL
  USING (public.is_admin());

CREATE POLICY "OAuth states service only"
  ON public.shopify_oauth_states FOR ALL
  USING (false);

-- Public view for sellers (excludes encrypted token)
CREATE OR REPLACE VIEW public.dealer_shopify_stores_public AS
SELECT
  id,
  dealer_id,
  user_id,
  shop_domain,
  shop_name,
  connected_at,
  last_sync,
  sync_status,
  products_imported,
  integration_enabled,
  seller_fee_rate,
  created_at,
  updated_at
FROM public.dealer_shopify_stores;

GRANT SELECT ON public.dealer_shopify_stores_public TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_dealer_for_user(uuid) TO service_role;
