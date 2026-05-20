do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'template_status'
  ) then
    create type public.template_status as enum (
      'draft',
      'review',
      'published',
      'hidden',
      'archived',
      'rejected'
    );
  end if;
end $$;

create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  avatar_url text,
  social_links jsonb default '{}'::jsonb,
  is_verified boolean default false,
  total_template_views integer default 0,
  total_template_uses integer default 0,
  created_at timestamptz default now()
);

create unique index if not exists creator_profiles_user_id_key
  on public.creator_profiles(user_id);

alter table public.templates
  add column if not exists creator_id uuid references public.creator_profiles(id),
  add column if not exists status public.template_status default 'draft',
  add column if not exists is_marketplace_template boolean default false,
  add column if not exists moderation_notes text,
  add column if not exists published_at timestamptz;

create index if not exists templates_creator_id_idx
  on public.templates(creator_id);

create index if not exists templates_status_idx
  on public.templates(status);

create index if not exists templates_marketplace_status_idx
  on public.templates(is_marketplace_template, status);

update public.templates
set
  status = case
    when is_active = true then 'published'::public.template_status
    else 'hidden'::public.template_status
  end,
  is_marketplace_template = coalesce(is_marketplace_template, false),
  published_at = case
    when is_active = true then coalesce(published_at, created_at, now())
    else published_at
  end
where status is null
   or published_at is null;

create table if not exists public.template_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text,
  created_at timestamptz default now()
);

create table if not exists public.template_category_mappings (
  template_id uuid not null references public.templates(id) on delete cascade,
  category_id uuid not null references public.template_categories(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (template_id, category_id)
);

insert into public.template_categories (name, slug, icon)
values
  ('Birthday', 'birthday', 'cake'),
  ('Wedding', 'wedding', 'rings'),
  ('Anniversary', 'anniversary', 'heart'),
  ('Festival', 'festival', 'sparkles'),
  ('Graduation', 'graduation', 'graduation-cap')
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon;

insert into public.creator_profiles (user_id, display_name, avatar_url, is_verified)
select
  profiles.id,
  coalesce(nullif(profiles.full_name, ''), split_part(profiles.email, '@', 1), 'Creator'),
  profiles.avatar_url,
  profiles.role = 'admin'
from public.profiles
where profiles.role in ('creator', 'admin')
on conflict (user_id) do update set
  display_name = coalesce(public.creator_profiles.display_name, excluded.display_name),
  avatar_url = coalesce(public.creator_profiles.avatar_url, excluded.avatar_url),
  is_verified = public.creator_profiles.is_verified or excluded.is_verified;

update public.templates
set creator_id = coalesce(
  creator_id,
  (select id from public.creator_profiles order by is_verified desc, created_at asc limit 1)
)
where creator_id is null
  and exists (select 1 from public.creator_profiles);

insert into storage.buckets (id, name, public)
values ('template-thumbnails', 'template-thumbnails', true)
on conflict (id) do nothing;

drop view if exists public.creator_template_metrics;
create view public.creator_template_metrics
with (security_invoker = false)
as
select
  creator_profiles.id as creator_id,
  creator_profiles.user_id,
  coalesce(views.total_views, 0)::integer as total_views,
  coalesce(uses.total_uses, 0)::integer as total_uses,
  count(distinct templates.id)::integer as template_count,
  case
    when coalesce(views.total_views, 0) = 0 then 0::numeric
    else round((coalesce(uses.total_uses, 0)::numeric / views.total_views::numeric) * 100, 2)
  end as conversion_rate
from public.creator_profiles
left join public.templates
  on templates.creator_id = creator_profiles.id
left join (
  select
    templates.creator_id,
    count(wish_views.id) as total_views
  from public.templates
  join public.wishes
    on wishes.template_id = templates.id
  join public.wish_views
    on wish_views.wish_id = wishes.id
  group by templates.creator_id
) views
  on views.creator_id = creator_profiles.id
left join (
  select
    creator_id,
    count(*) as total_uses
  from public.templates
  join public.wishes
    on wishes.template_id = templates.id
  group by creator_id
) uses
  on uses.creator_id = creator_profiles.id
where creator_profiles.user_id = auth.uid()
   or public.is_admin(auth.uid())
group by creator_profiles.id, creator_profiles.user_id, views.total_views, uses.total_uses;

drop view if exists public.template_performance_metrics;
create view public.template_performance_metrics
with (security_invoker = false)
as
select
  templates.id as template_id,
  templates.creator_id,
  templates.name as template_name,
  templates.slug as template_slug,
  coalesce(views.total_views, 0)::integer as total_views,
  coalesce(uses.total_uses, 0)::integer as total_uses,
  coalesce(conversions.total_conversions, 0)::integer as total_conversions,
  case
    when coalesce(uses.total_uses, 0) = 0 then 0::numeric
    else round((coalesce(conversions.total_conversions, 0)::numeric / uses.total_uses::numeric) * 100, 2)
  end as conversion_rate
from public.templates
left join (
  select wishes.template_id, count(*) as total_views
  from public.wish_views
  join public.wishes on wishes.id = wish_views.wish_id
  group by wishes.template_id
) views on views.template_id = templates.id
left join (
  select template_id, count(*) as total_uses
  from public.wishes
  group by template_id
) uses on uses.template_id = templates.id
left join (
  select template_id, count(*) as total_conversions
  from public.orders
  where status = 'paid'
  group by template_id
) conversions on conversions.template_id = templates.id
where public.is_admin(auth.uid())
   or templates.creator_id in (
    select id
    from public.creator_profiles
    where user_id = auth.uid()
  )
order by total_views desc, total_uses desc, templates.name asc;

alter table public.creator_profiles enable row level security;
alter table public.templates enable row level security;
alter table public.template_categories enable row level security;
alter table public.template_category_mappings enable row level security;

drop policy if exists "Creators can read own creator profile" on public.creator_profiles;
drop policy if exists "Creators can create own creator profile" on public.creator_profiles;
drop policy if exists "Creators can update own creator profile" on public.creator_profiles;
drop policy if exists "Admins can manage creator profiles" on public.creator_profiles;
drop policy if exists "Public can read verified creator profiles" on public.creator_profiles;

create policy "Creators can read own creator profile"
  on public.creator_profiles for select
  using (user_id = auth.uid());

create policy "Creators can create own creator profile"
  on public.creator_profiles for insert
  with check (
    user_id = auth.uid()
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
  );

create policy "Creators can update own creator profile"
  on public.creator_profiles for update
  using (
    user_id = auth.uid()
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
  )
  with check (
    user_id = auth.uid()
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
  );

create policy "Admins can manage creator profiles"
  on public.creator_profiles for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Public can read verified creator profiles"
  on public.creator_profiles for select
  using (is_verified = true);

drop policy if exists "Templates are publicly readable" on public.templates;
drop policy if exists "Public can read published templates" on public.templates;
drop policy if exists "Creators can read owned templates" on public.templates;
drop policy if exists "Creators can create owned templates" on public.templates;
drop policy if exists "Creators can update owned templates" on public.templates;
drop policy if exists "Admins can manage templates" on public.templates;

create policy "Public can read published templates"
  on public.templates for select
  using (is_active = true and status = 'published');

create policy "Creators can read owned templates"
  on public.templates for select
  using (
    creator_id in (
      select id
      from public.creator_profiles
      where user_id = auth.uid()
    )
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
  );

create policy "Creators can create owned templates"
  on public.templates for insert
  with check (
    creator_id in (
      select id
      from public.creator_profiles
      where user_id = auth.uid()
    )
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
    and status in ('draft', 'review')
    and is_active = false
  );

create policy "Creators can update owned templates"
  on public.templates for update
  using (
    creator_id in (
      select id
      from public.creator_profiles
      where user_id = auth.uid()
    )
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
  )
  with check (
    creator_id in (
      select id
      from public.creator_profiles
      where user_id = auth.uid()
    )
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
    and status in ('draft', 'review', 'archived')
    and is_active = false
  );

create policy "Admins can manage templates"
  on public.templates for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Public can read template categories" on public.template_categories;
drop policy if exists "Admins can manage template categories" on public.template_categories;
drop policy if exists "Public can read template category mappings" on public.template_category_mappings;
drop policy if exists "Admins can manage template category mappings" on public.template_category_mappings;

create policy "Public can read template categories"
  on public.template_categories for select
  using (true);

create policy "Admins can manage template categories"
  on public.template_categories for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Public can read template category mappings"
  on public.template_category_mappings for select
  using (true);

create policy "Admins can manage template category mappings"
  on public.template_category_mappings for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Anyone can read template thumbnails" on storage.objects;
drop policy if exists "Creators can upload template thumbnails" on storage.objects;
drop policy if exists "Creators can update template thumbnails" on storage.objects;

create policy "Anyone can read template thumbnails"
  on storage.objects for select
  using (bucket_id = 'template-thumbnails');

create policy "Creators can upload template thumbnails"
  on storage.objects for insert
  with check (
    bucket_id = 'template-thumbnails'
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
  );

create policy "Creators can update template thumbnails"
  on storage.objects for update
  using (
    bucket_id = 'template-thumbnails'
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
  )
  with check (
    bucket_id = 'template-thumbnails'
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
  );

notify pgrst, 'reload schema';
