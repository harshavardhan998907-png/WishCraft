create type public.template_tier as enum ('free', 'standard', 'premium');
create type public.occasion_type as enum (
  'birthday', 'wedding', 'anniversary', 'festival',
  'graduation', 'baby_shower', 'farewell', 'valentine', 'other'
);

create table public.templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  occasion occasion_type not null,
  tier template_tier not null default 'free',
  price_paise integer not null default 0,
  thumbnail_url text,
  preview_url text,
  has_animation boolean default false,
  has_music boolean default false,
  component_name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.templates enable row level security;
create policy "Templates are publicly readable"
  on public.templates for select using (true);
