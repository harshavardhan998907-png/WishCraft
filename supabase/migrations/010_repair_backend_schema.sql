create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'template_tier') then
    create type public.template_tier as enum ('free', 'standard', 'premium');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'occasion_type') then
    create type public.occasion_type as enum (
      'birthday', 'wedding', 'anniversary', 'festival',
      'graduation', 'baby_shower', 'farewell', 'valentine', 'other'
    );
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'wish_status') then
    create type public.wish_status as enum ('draft', 'active', 'expired', 'deleted');
  end if;

  if not exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'order_status') then
    create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  occasion public.occasion_type not null,
  tier public.template_tier not null default 'free',
  price_paise integer not null default 0 check (price_paise >= 0),
  thumbnail_url text,
  preview_url text,
  has_animation boolean not null default false,
  has_music boolean not null default false,
  component_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid not null references public.templates(id),
  slug text not null unique,
  recipient_name text not null,
  sender_name text not null,
  custom_message text,
  photo_urls text[] not null default '{}',
  music_url text,
  status public.wish_status not null default 'draft',
  is_paid boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  wish_id uuid not null references public.wishes(id) on delete cascade,
  template_id uuid not null references public.templates(id),
  amount_paise integer not null check (amount_paise >= 0),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  mood text,
  occasion public.occasion_type,
  url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

delete from public.music_tracks a
using public.music_tracks b
where a.title = b.title
  and a.ctid < b.ctid;

alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.wishes enable row level security;
alter table public.orders enable row level security;
alter table public.music_tracks enable row level security;

create unique index if not exists templates_slug_key on public.templates (slug);
create unique index if not exists wishes_slug_key on public.wishes (slug);
create index if not exists wishes_user_id_created_at_idx on public.wishes (user_id, created_at desc);
create index if not exists wishes_expiry_idx on public.wishes (status, expires_at);
create index if not exists wishes_template_id_idx on public.wishes (template_id);
create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
create index if not exists orders_razorpay_order_id_idx on public.orders (razorpay_order_id);
create index if not exists orders_wish_id_idx on public.orders (wish_id);
create index if not exists music_tracks_active_idx on public.music_tracks (is_active, occasion);
create unique index if not exists music_tracks_title_key on public.music_tracks (title);

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Templates are publicly readable" on public.templates;
create policy "Templates are publicly readable" on public.templates for select using (is_active = true);

drop policy if exists "Users can manage own wishes" on public.wishes;
drop policy if exists "Active wishes are publicly readable by slug" on public.wishes;
drop policy if exists "Users can view own wishes" on public.wishes;
drop policy if exists "Users can create own wishes" on public.wishes;
drop policy if exists "Users can update own wishes" on public.wishes;
create policy "Users can view own wishes" on public.wishes for select using (auth.uid() = user_id);
create policy "Active wishes are publicly readable by slug" on public.wishes for select using (status = 'active');
create policy "Users can create own wishes" on public.wishes for insert with check (auth.uid() = user_id);
create policy "Users can update own wishes" on public.wishes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Users can create own pending orders" on public.orders;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can create own pending orders" on public.orders for insert with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Music tracks are publicly readable" on public.music_tracks;
create policy "Music tracks are publicly readable" on public.music_tracks for select using (is_active = true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.profiles (id, email, full_name, avatar_url, created_at)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data->>'full_name', ''),
  users.raw_user_meta_data->>'avatar_url',
  coalesce(users.created_at, now())
from auth.users
where users.email is not null
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
  avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

create or replace function public.activate_paid_wish(
  target_order_id uuid,
  target_wish_id uuid,
  payment_id text,
  payment_signature text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set
    status = 'paid',
    razorpay_payment_id = payment_id,
    razorpay_signature = payment_signature,
    paid_at = now()
  where id = target_order_id
    and wish_id = target_wish_id
    and status = 'pending';

  if not found then
    raise exception 'Pending order not found for wish';
  end if;

  update public.wishes
  set
    status = 'active',
    is_paid = true,
    activated_at = now(),
    expires_at = now() + interval '7 days'
  where id = target_wish_id
    and status = 'draft';

  if not found then
    raise exception 'Draft wish not found for activation';
  end if;
end;
$$;

insert into public.templates (
  name, slug, occasion, tier, price_paise, thumbnail_url, preview_url,
  has_animation, has_music, component_name, is_active
)
values
  ('Birthday Classic', 'birthday-classic', 'birthday', 'free', 0, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=900&q=80', null, true, false, 'birthday-classic', true),
  ('Birthday Glow', 'birthday-glow', 'birthday', 'standard', 9900, 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80', null, true, true, 'birthday-glow', true),
  ('Wedding Elegant', 'wedding-elegant', 'wedding', 'premium', 19900, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80', null, true, true, 'wedding-elegant', true),
  ('Anniversary Romantic', 'anniversary-romantic', 'anniversary', 'standard', 12900, 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80', null, true, true, 'anniversary-romantic', true),
  ('Festival Diwali', 'festival-diwali', 'festival', 'premium', 17900, 'https://images.unsplash.com/photo-1605292356183-a77d0a9c9d1d?auto=format&fit=crop&w=900&q=80', null, true, true, 'festival-diwali', true),
  ('Graduation Celebration', 'graduation-celebration', 'graduation', 'free', 0, 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80', null, true, false, 'graduation-celebration', true)
on conflict (slug) do update set
  name = excluded.name,
  occasion = excluded.occasion,
  tier = excluded.tier,
  price_paise = excluded.price_paise,
  thumbnail_url = excluded.thumbnail_url,
  preview_url = excluded.preview_url,
  has_animation = excluded.has_animation,
  has_music = excluded.has_music,
  component_name = excluded.component_name,
  is_active = excluded.is_active;

insert into public.music_tracks (title, mood, occasion, url, is_active)
values
  ('Gentle Piano', 'calm', 'anniversary', 'https://example.com/music/gentle-piano.mp3', true),
  ('Warm Celebration', 'happy', 'birthday', 'https://example.com/music/warm-celebration.mp3', true),
  ('Soft Romance', 'romantic', 'wedding', 'https://example.com/music/soft-romance.mp3', true),
  ('Festival Lights', 'festive', 'festival', 'https://example.com/music/festival-lights.mp3', true),
  ('Bright Future', 'uplifting', 'graduation', 'https://example.com/music/bright-future.mp3', true)
on conflict (title) do update set
  mood = excluded.mood,
  occasion = excluded.occasion,
  url = excluded.url,
  is_active = excluded.is_active;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('wish-photos', 'wish-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('wish-music', 'wish-music', true, 10485760, array['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read wish photos" on storage.objects;
drop policy if exists "Auth users can upload wish photos" on storage.objects;
drop policy if exists "Users can update own wish photos" on storage.objects;
drop policy if exists "Users can delete own wish photos" on storage.objects;
drop policy if exists "Anyone can read wish music" on storage.objects;
drop policy if exists "Auth users can upload wish music" on storage.objects;
drop policy if exists "Users can update own wish music" on storage.objects;
drop policy if exists "Users can delete own wish music" on storage.objects;

create policy "Anyone can read wish photos"
  on storage.objects for select using (bucket_id = 'wish-photos');

create policy "Auth users can upload wish photos"
  on storage.objects for insert
  with check (bucket_id = 'wish-photos' and auth.role() = 'authenticated');

create policy "Users can update own wish photos"
  on storage.objects for update
  using (bucket_id = 'wish-photos' and auth.uid() = owner)
  with check (bucket_id = 'wish-photos' and auth.uid() = owner);

create policy "Users can delete own wish photos"
  on storage.objects for delete
  using (bucket_id = 'wish-photos' and auth.uid() = owner);

create policy "Anyone can read wish music"
  on storage.objects for select using (bucket_id = 'wish-music');

create policy "Auth users can upload wish music"
  on storage.objects for insert
  with check (bucket_id = 'wish-music' and auth.role() = 'authenticated');

create policy "Users can update own wish music"
  on storage.objects for update
  using (bucket_id = 'wish-music' and auth.uid() = owner)
  with check (bucket_id = 'wish-music' and auth.uid() = owner);

create policy "Users can delete own wish music"
  on storage.objects for delete
  using (bucket_id = 'wish-music' and auth.uid() = owner);

notify pgrst, 'reload schema';
