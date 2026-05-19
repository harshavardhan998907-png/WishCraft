create type public.wish_status as enum ('draft', 'active', 'expired', 'deleted');

create table public.wishes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  template_id uuid references public.templates(id) not null,
  slug text unique not null,
  recipient_name text not null,
  sender_name text not null,
  custom_message text,
  photo_urls text[] default '{}',
  music_url text,
  status wish_status default 'draft',
  is_paid boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now(),
  activated_at timestamptz
);

alter table public.wishes enable row level security;

create policy "Users can manage own wishes"
  on public.wishes for all using (auth.uid() = user_id);

create policy "Active wishes are publicly readable by slug"
  on public.wishes for select using (status = 'active');

create index wishes_user_id_created_at_idx on public.wishes (user_id, created_at desc);
create index wishes_slug_idx on public.wishes (slug);
create index wishes_expiry_idx on public.wishes (status, expires_at);
