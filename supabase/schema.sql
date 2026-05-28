-- HourMark Supabase Schema
-- Fresh install only: run in Supabase SQL Editor on a new project.
-- Existing project? Run supabase/migrations/20260527180000_seller_verification.sql instead.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (extends auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  bio text,
  verified boolean default false,
  stripe_account_id text,
  stripe_onboarding_status text default 'not_started'
    check (stripe_onboarding_status in ('not_started', 'pending', 'complete', 'restricted')),
  seller_rating numeric(3, 2) default 0,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users are viewable by everyone"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- Listings
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.users(id) on delete cascade not null,
  brand text not null,
  model text not null,
  reference_number text,
  year integer,
  condition text not null,
  price integer not null, -- cents
  description text,
  images text[] default '{}',
  serial_number text,
  status text default 'active' check (status in ('draft', 'active', 'sold', 'archived')),
  authenticated boolean default false,
  created_at timestamptz default now()
);

alter table public.listings enable row level security;

create policy "Active listings are public"
  on public.listings for select using (status = 'active' or seller_id = auth.uid());

create policy "Sellers can insert listings"
  on public.listings for insert with check (auth.uid() = seller_id);

create policy "Sellers can update own listings"
  on public.listings for update using (auth.uid() = seller_id);

-- Favorites
create table public.favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

alter table public.favorites enable row level security;

create policy "Users manage own favorites"
  on public.favorites for all using (auth.uid() = user_id);

-- Conversations
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete set null,
  buyer_id uuid references public.users(id) on delete cascade not null,
  seller_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.conversations enable row level security;

create policy "Participants can view conversations"
  on public.conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyers can create conversations"
  on public.conversations for insert with check (auth.uid() = buyer_id);

-- Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  text text not null,
  read_at timestamptz,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- Sellers (Stripe Connect)
create table public.sellers (
  id uuid references public.users(id) on delete cascade primary key,
  business_name text,
  onboarding_complete boolean default false not null,
  payouts_enabled boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.sellers enable row level security;

create policy "Sellers are viewable by everyone"
  on public.sellers for select using (true);

create policy "Users can update own seller profile"
  on public.sellers for update using (auth.uid() = id);

create policy "Users can insert own seller profile"
  on public.sellers for insert with check (auth.uid() = id);

-- Stripe Connect accounts
create table public.stripe_accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  stripe_account_id text not null unique,
  charges_enabled boolean default false not null,
  payouts_enabled boolean default false not null,
  details_submitted boolean default false not null,
  onboarding_complete boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.stripe_accounts enable row level security;

create policy "Users can view own stripe account"
  on public.stripe_accounts for select using (auth.uid() = user_id);

-- Orders
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  buyer_id uuid references public.users(id) on delete cascade not null,
  seller_id uuid references public.users(id) on delete cascade not null,
  listing_id uuid references public.listings(id) on delete cascade not null,
  amount integer not null,
  commission_fee integer not null,
  status text default 'pending' check (status in ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number text,
  stripe_payment_intent_id text,
  payment_method text default 'card'
    check (payment_method in ('card', 'apple_pay', 'wire_transfer')),
  wire_reference text,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  shipping_address_line1 text,
  shipping_address_line2 text,
  shipping_city text,
  shipping_state text,
  shipping_postal_code text,
  shipping_country text default 'US',
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Buyers and sellers can view orders"
  on public.orders for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Transactions
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  amount integer not null,
  commission_fee integer not null,
  seller_payout integer not null,
  stripe_transfer_id text,
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;

create policy "Order participants can view transactions"
  on public.transactions for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
      and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

-- Seller verifications
create table public.seller_verifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  document_url text,
  stripe_account_id text,
  rejection_reason text,
  requirements_due jsonb default '[]'::jsonb,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table public.seller_verifications enable row level security;

create policy "Users can view own verification"
  on public.seller_verifications for select using (auth.uid() = user_id);

create policy "Users can submit verification"
  on public.seller_verifications for insert with check (auth.uid() = user_id);

-- Storage bucket for listing images
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict do nothing;

create policy "Anyone can view listing images"
  on storage.objects for select using (bucket_id = 'listing-images');

create policy "Authenticated users can upload listing images"
  on storage.objects for insert
  with check (bucket_id = 'listing-images' and auth.role() = 'authenticated');

-- Realtime for messages
alter publication supabase_realtime add table public.messages;

-- Trigger: auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, verified)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    false
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Sync seller verification state from Stripe Connect webhooks (service role only)
create or replace function public.sync_seller_verification(
  p_user_id uuid,
  p_stripe_account_id text,
  p_status text,
  p_requirements_due jsonb default '[]'::jsonb,
  p_rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_onboarding_status text;
  v_verified boolean;
  v_verification_id uuid;
begin
  if p_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid verification status: %', p_status;
  end if;

  v_verified := p_status = 'approved';
  v_onboarding_status := case
    when p_status = 'approved' then 'complete'
    when p_status = 'rejected' then 'restricted'
    else 'pending'
  end;

  update public.users
  set
    verified = v_verified,
    stripe_account_id = p_stripe_account_id,
    stripe_onboarding_status = v_onboarding_status
  where id = p_user_id;

  select id into v_verification_id
  from public.seller_verifications
  where user_id = p_user_id
  order by submitted_at desc
  limit 1;

  if v_verification_id is not null then
    update public.seller_verifications
    set
      status = p_status,
      stripe_account_id = p_stripe_account_id,
      rejection_reason = p_rejection_reason,
      requirements_due = coalesce(p_requirements_due, '[]'::jsonb),
      reviewed_at = case
        when p_status in ('approved', 'rejected') then now()
        else reviewed_at
      end
    where id = v_verification_id;
  else
    insert into public.seller_verifications (
      user_id,
      status,
      stripe_account_id,
      rejection_reason,
      requirements_due,
      reviewed_at
    )
    values (
      p_user_id,
      p_status,
      p_stripe_account_id,
      p_rejection_reason,
      coalesce(p_requirements_due, '[]'::jsonb),
      case when p_status in ('approved', 'rejected') then now() else null end
    );
  end if;
end;
$$;

revoke all on function public.sync_seller_verification(uuid, text, text, jsonb, text) from public;
grant execute on function public.sync_seller_verification(uuid, text, text, jsonb, text) to service_role;
