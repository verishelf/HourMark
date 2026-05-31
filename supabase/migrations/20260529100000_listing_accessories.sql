-- Box, papers, and warranty card flags for listings

alter table public.listings
  add column if not exists includes_box boolean default false,
  add column if not exists includes_papers boolean default false,
  add column if not exists includes_warranty_card boolean default false;

update public.listings
set
  includes_box = true,
  includes_papers = true
where trust_badges::text ilike '%full_set%'
   or description ilike '%full set%'
   or description ilike '%box and papers%';

update public.listings
set includes_warranty_card = true
where description ilike '%warranty card%';
