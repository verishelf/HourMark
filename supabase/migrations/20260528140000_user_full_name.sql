alter table public.users
  add column if not exists full_name text;
