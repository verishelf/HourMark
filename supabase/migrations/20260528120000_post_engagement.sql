-- Post likes
create table public.user_post_likes (
  post_id uuid references public.user_posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

alter table public.user_post_likes enable row level security;

create policy "Post likes are viewable by everyone"
  on public.user_post_likes for select using (true);

create policy "Users can like posts"
  on public.user_post_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on public.user_post_likes for delete using (auth.uid() = user_id);

-- Post comments
create table public.user_post_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.user_posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

create index user_post_comments_post_id_idx
  on public.user_post_comments (post_id, created_at asc);

alter table public.user_post_comments enable row level security;

create policy "Post comments are viewable by everyone"
  on public.user_post_comments for select using (true);

create policy "Users can comment on posts"
  on public.user_post_comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on public.user_post_comments for delete using (auth.uid() = user_id);
