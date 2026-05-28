-- Seller verification migration (safe to run on existing HourMark databases)
-- Run this in Supabase SQL Editor if tables already exist.
-- Do NOT re-run supabase/schema.sql on an existing project.

-- users: Stripe onboarding status
alter table public.users
  add column if not exists stripe_onboarding_status text default 'not_started';

update public.users
set stripe_onboarding_status = 'not_started'
where stripe_onboarding_status is null;

alter table public.users
  alter column stripe_onboarding_status set default 'not_started';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_stripe_onboarding_status_check'
  ) then
    alter table public.users
      add constraint users_stripe_onboarding_status_check
      check (stripe_onboarding_status in ('not_started', 'pending', 'complete', 'restricted'));
  end if;
end $$;

-- seller_verifications: create table if missing, then add Stripe Connect fields
create table if not exists public.seller_verifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  document_url text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz
);

alter table public.seller_verifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'seller_verifications'
      and policyname = 'Users can view own verification'
  ) then
    create policy "Users can view own verification"
      on public.seller_verifications for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'seller_verifications'
      and policyname = 'Users can submit verification'
  ) then
    create policy "Users can submit verification"
      on public.seller_verifications for insert with check (auth.uid() = user_id);
  end if;
end $$;

alter table public.seller_verifications
  add column if not exists stripe_account_id text;

alter table public.seller_verifications
  add column if not exists rejection_reason text;

alter table public.seller_verifications
  add column if not exists requirements_due jsonb default '[]'::jsonb;

update public.seller_verifications
set requirements_due = '[]'::jsonb
where requirements_due is null;

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
