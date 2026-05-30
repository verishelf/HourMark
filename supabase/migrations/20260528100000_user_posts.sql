-- Profile posts (separate from marketplace listings)
create table public.user_posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  caption text,
  image_url text not null,
  created_at timestamptz default now()
);

create index user_posts_user_id_created_at_idx
  on public.user_posts (user_id, created_at desc);

alter table public.user_posts enable row level security;

create policy "Posts are viewable by everyone"
  on public.user_posts for select using (true);

create policy "Users can create own posts"
  on public.user_posts for insert with check (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.user_posts for delete using (auth.uid() = user_id);

-- Post image storage
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict do nothing;

create policy "Anyone can view post images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Users can upload post images"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own post images"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
