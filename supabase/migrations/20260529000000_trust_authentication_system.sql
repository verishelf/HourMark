-- Luxury watch trust, authentication, escrow, and fraud prevention

-- ============ USERS (KYC) ============
alter table public.users
  add column if not exists is_verified_seller boolean default false,
  add column if not exists kyc_status text default 'not_started'
    check (kyc_status in ('not_started', 'pending', 'approved', 'rejected')),
  add column if not exists phone_number text,
  add column if not exists kyc_provider_id text,
  add column if not exists kyc_provider text check (kyc_provider in ('persona', 'onfido', 'stripe')),
  add column if not exists account_trust_score integer default 50
    check (account_trust_score between 0 and 100),
  add column if not exists fraud_risk_score integer default 0
    check (fraud_risk_score between 0 and 100);

update public.users
set is_verified_seller = coalesce(verified, false)
where is_verified_seller is distinct from verified;

update public.users
set kyc_status = 'approved'
where verified = true and kyc_status = 'not_started';

-- ============ LISTINGS (AI AUTH) ============
alter table public.listings
  add column if not exists authentication_status text default 'pending'
    check (authentication_status in ('pending', 'analyzing', 'auto_verified', 'manual_review', 'rejected')),
  add column if not exists ai_trust_score integer default 0
    check (ai_trust_score between 0 and 100),
  add column if not exists fraud_flags jsonb default '[]'::jsonb,
  add column if not exists extracted_serial_number text,
  add column if not exists verification_confidence numeric(5,2) default 0,
  add column if not exists trust_badges jsonb default '[]'::jsonb,
  add column if not exists image_fingerprint text;

create index if not exists listings_auth_status_idx on public.listings (authentication_status);
create index if not exists listings_serial_hash_idx on public.listings (extracted_serial_number);

-- ============ SERIAL REGISTRY ============
create table if not exists public.serial_registry (
  id uuid primary key default uuid_generate_v4(),
  serial_hash text not null,
  serial_normalized text,
  listing_id uuid references public.listings(id) on delete set null,
  seller_id uuid references public.users(id) on delete set null not null,
  brand text,
  first_seen_at timestamptz default now(),
  unique (serial_hash)
);

create index if not exists serial_registry_seller_idx on public.serial_registry (seller_id);

-- ============ LISTING VERIFICATION ASSETS ============
create table if not exists public.listing_verification_assets (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  asset_type text not null check (asset_type in (
    'serial', 'front', 'movement', 'box_papers', 'video'
  )),
  storage_path text not null,
  mime_type text,
  phash text,
  exif_json jsonb default '{}'::jsonb,
  flags jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists listing_assets_listing_idx on public.listing_verification_assets (listing_id);

-- ============ KYC SUBMISSIONS ============
create table if not exists public.kyc_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  id_document_path text,
  selfie_path text,
  phone_number text,
  provider text check (provider in ('persona', 'onfido')),
  provider_inquiry_id text,
  status text default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  metadata jsonb default '{}'::jsonb,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz
);

create index if not exists kyc_submissions_user_idx on public.kyc_submissions (user_id);

-- ============ ACCOUNT FRAUD EVENTS ============
create table if not exists public.fraud_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  event_type text not null,
  risk_delta integer default 0,
  metadata jsonb default '{}'::jsonb,
  device_fingerprint text,
  ip_address text,
  created_at timestamptz default now()
);

create index if not exists fraud_events_user_idx on public.fraud_events (user_id);

-- ============ ORDERS (ESCROW) ============
alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add column if not exists inspection_ends_at timestamptz,
  add column if not exists delivery_confirmed_at timestamptz,
  add column if not exists funds_released_at timestamptz,
  add column if not exists escrow_status text default 'none'
    check (escrow_status in ('none', 'held', 'released', 'disputed'));

alter table public.orders
  add constraint orders_status_check check (status in (
    'pending',
    'awaiting_payment',
    'payment_held',
    'paid',
    'shipped',
    'delivered',
    'inspection_period',
    'completed',
    'disputed',
    'cancelled',
    'refunded'
  ));

-- ============ STORAGE BUCKETS (private) ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('kyc-documents', 'kyc-documents', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('watch-serials', 'watch-serials', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('movement-images', 'movement-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('watch-videos', 'watch-videos', false, 52428800, array['video/mp4', 'video/quicktime', 'video/webm']),
  ('watch-box-images', 'watch-box-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- KYC: own folder only
create policy "Users upload own KYC"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users read own KYC"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Trust assets: seller owns listing folder
create policy "Sellers upload trust assets"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('watch-serials', 'movement-images', 'watch-videos', 'watch-box-images')
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(name))[1]
      and l.seller_id = auth.uid()
    )
  );

create policy "Sellers read own trust assets"
  on storage.objects for select to authenticated
  using (
    bucket_id in ('watch-serials', 'movement-images', 'watch-videos', 'watch-box-images')
    and exists (
      select 1 from public.listings l
      where l.id::text = (storage.foldername(name))[1]
      and l.seller_id = auth.uid()
    )
  );

-- ============ RLS ============
alter table public.serial_registry enable row level security;
alter table public.listing_verification_assets enable row level security;
alter table public.kyc_submissions enable row level security;
alter table public.fraud_events enable row level security;

create policy "Sellers view own serial registry"
  on public.serial_registry for select
  using (auth.uid() = seller_id);

create policy "Public serial check via service role only"
  on public.serial_registry for insert
  with check (auth.uid() = seller_id);

create policy "Sellers manage listing assets"
  on public.listing_verification_assets for all
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id = auth.uid()
    )
  );

create policy "Buyers view assets for purchased listings"
  on public.listing_verification_assets for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
      and l.authentication_status = 'auto_verified'
      and l.status = 'active'
    )
  );

create policy "Users view own KYC submissions"
  on public.kyc_submissions for select
  using (auth.uid() = user_id);

create policy "Users insert own KYC submissions"
  on public.kyc_submissions for insert
  with check (auth.uid() = user_id);

create policy "Users view own fraud events"
  on public.fraud_events for select
  using (auth.uid() = user_id);

-- Listings: only auto-verified active visible to all
drop policy if exists "Active listings are public" on public.listings;

-- Grandfather existing live listings
update public.listings
set authentication_status = 'auto_verified',
    ai_trust_score = greatest(coalesce(ai_trust_score, 0), 75),
    trust_badges = coalesce(trust_badges, '["escrow_protected"]'::jsonb)
where status = 'active'
  and authentication_status in ('pending', 'analyzing');
create policy "Verified active listings are public"
  on public.listings for select
  using (
    status = 'active'
    and authentication_status = 'auto_verified'
  );

create policy "Sellers view own listings any status"
  on public.listings for select
  using (auth.uid() = seller_id);
