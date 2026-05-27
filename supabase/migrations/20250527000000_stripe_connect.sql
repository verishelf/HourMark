-- HourMark Stripe Connect migration
-- Run after base schema.sql

-- Sellers profile (1:1 with users)
create table if not exists public.sellers (
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
create table if not exists public.stripe_accounts (
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

-- Orders: allow buyers to create pending orders via API (service role bypasses RLS)
create policy "Buyers can insert orders"
  on public.orders for insert with check (auth.uid() = buyer_id);

-- Transactions: status column for refund tracking
alter table public.transactions
  add column if not exists status text default 'pending'
    check (status in ('pending', 'completed', 'failed', 'refunded'));

alter table public.transactions
  add column if not exists stripe_charge_id text;

-- Orders indexes
create index if not exists orders_buyer_id_idx on public.orders(buyer_id);
create index if not exists orders_seller_id_idx on public.orders(seller_id);
create index if not exists orders_listing_id_idx on public.orders(listing_id);
create index if not exists orders_stripe_payment_intent_id_idx
  on public.orders(stripe_payment_intent_id);

-- Transactions indexes
create index if not exists transactions_order_id_idx on public.transactions(order_id);

-- Stripe accounts indexes
create index if not exists stripe_accounts_user_id_idx on public.stripe_accounts(user_id);
create index if not exists stripe_accounts_stripe_account_id_idx
  on public.stripe_accounts(stripe_account_id);

-- Auto-create seller row on user signup
create or replace function public.handle_new_seller()
returns trigger as $$
begin
  insert into public.sellers (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_created_seller on public.users;
create trigger on_user_created_seller
  after insert on public.users
  for each row execute procedure public.handle_new_seller();

-- Backfill sellers for existing users
insert into public.sellers (id)
select id from public.users
on conflict (id) do nothing;
