-- Crownly competitive features: offers, alerts, notifications, reviews,
-- passports, collection, grails, community extensions, order disputes

-- ============ LISTINGS ============
alter table public.listings
  add column if not exists min_offer_price integer,
  add column if not exists accepts_offers boolean default true;

-- ============ FAVORITES (price alerts) ============
alter table public.favorites
  add column if not exists price_alert_enabled boolean default true,
  add column if not exists saved_price integer;

-- ============ USERS (reputation) ============
alter table public.users
  add column if not exists seller_review_count integer default 0,
  add column if not exists total_sales integer default 0,
  add column if not exists grail_bio text;

-- ============ LISTING OFFERS ============
create table if not exists public.listing_offers (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  buyer_id uuid references public.users(id) on delete cascade not null,
  seller_id uuid references public.users(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id) on delete set null,
  amount integer not null check (amount > 0),
  status text default 'pending' not null check (status in (
    'pending', 'accepted', 'countered', 'declined', 'expired', 'withdrawn'
  )),
  parent_offer_id uuid references public.listing_offers(id) on delete set null,
  expires_at timestamptz default (now() + interval '7 days'),
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists listing_offers_listing_idx on public.listing_offers (listing_id, status);
create index if not exists listing_offers_buyer_idx on public.listing_offers (buyer_id);
create index if not exists listing_offers_seller_idx on public.listing_offers (seller_id);

alter table public.listing_offers enable row level security;

create policy "Offer participants can view offers"
  on public.listing_offers for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyers can create offers"
  on public.listing_offers for insert
  with check (auth.uid() = buyer_id);

create policy "Participants can update offers"
  on public.listing_offers for update
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- ============ SAVED SEARCHES ============
create table if not exists public.saved_searches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text,
  brand text,
  reference_number text,
  condition text,
  max_price integer,
  min_price integer,
  search_text text,
  alert_enabled boolean default true,
  created_at timestamptz default now()
);

create index if not exists saved_searches_user_idx on public.saved_searches (user_id);

alter table public.saved_searches enable row level security;

create policy "Users manage own saved searches"
  on public.saved_searches for all using (auth.uid() = user_id);

-- ============ PUSH TOKENS ============
create table if not exists public.push_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  token text not null,
  platform text default 'ios' check (platform in ('ios', 'android', 'web')),
  created_at timestamptz default now(),
  unique (user_id, token)
);

alter table public.push_tokens enable row level security;

create policy "Users manage own push tokens"
  on public.push_tokens for all using (auth.uid() = user_id);

-- ============ IN-APP NOTIFICATIONS ============
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  data jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- ============ SELLER REVIEWS ============
create table if not exists public.seller_reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null unique,
  reviewer_id uuid references public.users(id) on delete cascade not null,
  seller_id uuid references public.users(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create index if not exists seller_reviews_seller_idx on public.seller_reviews (seller_id);

alter table public.seller_reviews enable row level security;

create policy "Reviews are public"
  on public.seller_reviews for select using (true);

create policy "Buyers can submit reviews for own orders"
  on public.seller_reviews for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
      and o.buyer_id = auth.uid()
      and o.status = 'completed'
    )
  );

-- ============ AUTHENTICITY PASSPORTS ============
create table if not exists public.authenticity_passports (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete set null,
  serial_number text,
  brand text,
  model text,
  reference_number text,
  trust_score integer,
  verification_data jsonb default '{}'::jsonb,
  passport_code text not null unique,
  owner_id uuid references public.users(id) on delete set null,
  status text default 'active' check (status in ('active', 'revoked', 'transferred')),
  verified_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists passports_code_idx on public.authenticity_passports (passport_code);
create index if not exists passports_serial_idx on public.authenticity_passports (serial_number);

alter table public.authenticity_passports enable row level security;

create policy "Active passports are public"
  on public.authenticity_passports for select using (true);

-- ============ WATCH COLLECTION ============
create table if not exists public.watch_collection (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  brand text not null,
  model text not null,
  reference_number text,
  serial_number text,
  purchase_price integer,
  estimated_value integer,
  purchase_date date,
  includes_box boolean default false,
  includes_papers boolean default false,
  image_url text,
  order_id uuid references public.orders(id) on delete set null,
  passport_id uuid references public.authenticity_passports(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create index if not exists watch_collection_user_idx on public.watch_collection (user_id);

alter table public.watch_collection enable row level security;

create policy "Users manage own collection"
  on public.watch_collection for all using (auth.uid() = user_id);

create policy "Public collection view"
  on public.watch_collection for select using (true);

-- ============ GRAIL REQUESTS ============
create table if not exists public.grail_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  brand text,
  model text,
  reference_number text,
  max_budget integer,
  min_condition text,
  notes text,
  status text default 'active' check (status in ('active', 'fulfilled', 'cancelled')),
  created_at timestamptz default now()
);

create index if not exists grail_requests_status_idx on public.grail_requests (status, reference_number);

alter table public.grail_requests enable row level security;

create policy "Grail requests are public"
  on public.grail_requests for select using (true);

create policy "Users manage own grail requests"
  on public.grail_requests for insert with check (auth.uid() = user_id);

create policy "Users update own grail requests"
  on public.grail_requests for update using (auth.uid() = user_id);

create policy "Users delete own grail requests"
  on public.grail_requests for delete using (auth.uid() = user_id);

-- ============ USER POSTS (community) ============
alter table public.user_posts
  add column if not exists post_type text default 'general'
    check (post_type in ('general', 'wrist_shot', 'grail_hunt')),
  add column if not exists reference_number text;

-- ============ ORDERS (tracker + disputes) ============
alter table public.orders
  add column if not exists carrier text,
  add column if not exists delivery_photos text[] default '{}',
  add column if not exists dispute_status text
    check (dispute_status is null or dispute_status in ('open', 'resolved', 'rejected')),
  add column if not exists dispute_reason text,
  add column if not exists dispute_photos text[] default '{}';

-- ============ ACCEPTED OFFER ON ORDER ============
alter table public.orders
  add column if not exists accepted_offer_id uuid references public.listing_offers(id) on delete set null;

-- ============ UPDATE SELLER RATING TRIGGER ============
create or replace function public.update_seller_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set
    seller_rating = (
      select round(avg(rating)::numeric, 2)
      from public.seller_reviews
      where seller_id = new.seller_id
    ),
    seller_review_count = (
      select count(*)::integer
      from public.seller_reviews
      where seller_id = new.seller_id
    )
  where id = new.seller_id;
  return new;
end;
$$;

drop trigger if exists on_seller_review_insert on public.seller_reviews;
create trigger on_seller_review_insert
  after insert on public.seller_reviews
  for each row execute function public.update_seller_rating();

-- ============ NOTIFY ON OFFER ============
create or replace function public.notify_on_offer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing record;
  v_target uuid;
  v_title text;
begin
  select brand, model into v_listing from public.listings where id = new.listing_id;

  if tg_op = 'INSERT' then
    v_target := new.seller_id;
    v_title := 'New offer received';
    insert into public.notifications (user_id, type, title, body, data)
    values (
      v_target,
      'offer',
      v_title,
      format('Offer on %s %s', v_listing.brand, v_listing.model),
      jsonb_build_object('offer_id', new.id, 'listing_id', new.listing_id)
    );
  elsif new.status = 'accepted' and old.status is distinct from 'accepted' then
    v_target := new.buyer_id;
    insert into public.notifications (user_id, type, title, body, data)
    values (
      v_target,
      'offer_accepted',
      'Offer accepted',
      format('Your offer on %s %s was accepted', v_listing.brand, v_listing.model),
      jsonb_build_object('offer_id', new.id, 'listing_id', new.listing_id)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_listing_offer_change on public.listing_offers;
create trigger on_listing_offer_change
  after insert or update on public.listing_offers
  for each row execute function public.notify_on_offer();

alter publication supabase_realtime add table public.notifications;
