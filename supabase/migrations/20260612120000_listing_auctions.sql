-- Listing auctions: sale mode, timing, bids

alter table public.listings
  add column if not exists sale_mode text not null default 'fixed'
    check (sale_mode in ('fixed', 'auction')),
  add column if not exists auction_duration_days integer
    check (auction_duration_days is null or auction_duration_days between 1 and 30),
  add column if not exists auction_ends_at timestamptz,
  add column if not exists auction_starting_bid integer
    check (auction_starting_bid is null or auction_starting_bid > 0),
  add column if not exists auction_reserve_price integer
    check (auction_reserve_price is null or auction_reserve_price > 0),
  add column if not exists auction_current_bid integer
    check (auction_current_bid is null or auction_current_bid > 0),
  add column if not exists auction_bid_count integer not null default 0;

create index if not exists listings_auction_live_idx
  on public.listings (auction_ends_at)
  where sale_mode = 'auction' and status = 'active';

-- Start auction timer when listing goes live
create or replace function public.set_auction_end_on_activate()
returns trigger
language plpgsql
as $$
begin
  if NEW.sale_mode = 'auction'
     and NEW.status = 'active'
     and NEW.auction_ends_at is null
     and NEW.auction_duration_days is not null
  then
    if TG_OP = 'INSERT' then
      NEW.auction_ends_at := now() + (NEW.auction_duration_days || ' days')::interval;
    elsif TG_OP = 'UPDATE' and OLD.status is distinct from 'active' then
      NEW.auction_ends_at := now() + (NEW.auction_duration_days || ' days')::interval;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists listings_auction_end_on_activate on public.listings;
create trigger listings_auction_end_on_activate
  before insert or update on public.listings
  for each row execute function public.set_auction_end_on_activate();

-- Bids
create table if not exists public.listing_bids (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  bidder_id uuid references public.users(id) on delete cascade not null,
  amount integer not null check (amount > 0),
  created_at timestamptz default now()
);

create index if not exists listing_bids_listing_idx
  on public.listing_bids (listing_id, created_at desc);

alter table public.listing_bids enable row level security;

create policy "Bids visible on viewable listings"
  on public.listing_bids for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (
          (l.status = 'active' and l.authentication_status = 'auto_verified')
          or l.seller_id = auth.uid()
        )
    )
  );

create policy "Users view own bids"
  on public.listing_bids for select
  using (auth.uid() = bidder_id);

-- Atomic bid placement
create or replace function public.place_listing_bid(
  p_listing_id uuid,
  p_amount integer
)
returns public.listing_bids
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.listings;
  v_min_bid integer;
  v_increment integer := 10000; -- $100 minimum increment
  v_bid public.listing_bids;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if v_listing is null then
    raise exception 'Listing not found';
  end if;

  if v_listing.sale_mode <> 'auction' then
    raise exception 'Not an auction listing';
  end if;

  if v_listing.status <> 'active' then
    raise exception 'Auction is not active';
  end if;

  if v_listing.auction_ends_at is null or v_listing.auction_ends_at <= now() then
    raise exception 'Auction has ended';
  end if;

  if v_listing.seller_id = auth.uid() then
    raise exception 'Cannot bid on your own listing';
  end if;

  if v_listing.auction_current_bid is null then
    v_min_bid := coalesce(v_listing.auction_starting_bid, v_listing.price);
  else
    v_min_bid := v_listing.auction_current_bid + v_increment;
  end if;

  if p_amount < v_min_bid then
    raise exception 'Bid must be at least % cents', v_min_bid;
  end if;

  insert into public.listing_bids (listing_id, bidder_id, amount)
  values (p_listing_id, auth.uid(), p_amount)
  returning * into v_bid;

  update public.listings
  set auction_current_bid = p_amount,
      auction_bid_count = auction_bid_count + 1
  where id = p_listing_id;

  return v_bid;
end;
$$;

grant execute on function public.place_listing_bid(uuid, integer) to authenticated;
