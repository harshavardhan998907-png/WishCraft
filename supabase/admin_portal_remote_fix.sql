-- Template Hub admin portal hosted Supabase repair
-- Run this in the Supabase SQL editor for the hosted project.
-- It is idempotent and keeps RLS enabled.

alter table public.profiles
  add column if not exists role text default 'user';

alter table public.profiles
  alter column role set default 'user';

update public.profiles
set role = 'user'
where role is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('user', 'admin', 'moderator', 'creator'));
  end if;
end $$;

alter table public.profiles
  alter column role set not null;

create index if not exists profiles_role_idx on public.profiles(role);

create or replace function public.get_user_role(target_user uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (
      select role
      from public.profiles
      where id = target_user
        and role in ('user', 'admin', 'moderator', 'creator')
      limit 1
    ),
    'user'
  );
$$;

create or replace function public.is_admin(target_user uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.get_user_role(target_user) = 'admin', false);
$$;

create or replace function public.claim_admin_role(invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  admin_invite_code constant text := 'harsha123123';
begin
  if current_user_id is null then
    raise exception 'Admin invite requires an authenticated user.';
  end if;

  if coalesce(invite_code, '') <> admin_invite_code then
    raise exception 'Invalid admin invite code.';
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, role)
  select
    id,
    email,
    coalesce(raw_user_meta_data->>'full_name', ''),
    raw_user_meta_data->>'avatar_url',
    'admin'
  from auth.users
  where id = current_user_id
  on conflict (id) do update set
    email = excluded.email,
    role = 'admin';
end;
$$;

revoke all on function public.claim_admin_role(text) from public;
grant execute on function public.claim_admin_role(text) to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = public.get_user_role(auth.uid()));

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id and role = 'user');

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

insert into public.profiles (id, email, full_name, avatar_url, role)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', ''),
  raw_user_meta_data->>'avatar_url',
  'admin'
from auth.users
where lower(email) = lower('harshavardhan998907@gmail.com')
on conflict (id) do update set
  email = excluded.email,
  role = 'admin';

update public.profiles
set role = 'admin'
where lower(email) = lower('harshavardhan998907@gmail.com');

drop policy if exists "Admins can manage templates" on public.templates;
create policy "Admins can manage templates"
  on public.templates for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can view all wishes" on public.wishes;
drop policy if exists "Admins can update all wishes" on public.wishes;
drop policy if exists "Admins can delete wishes" on public.wishes;

create policy "Admins can view all wishes"
  on public.wishes for select
  using (public.is_admin(auth.uid()));

create policy "Admins can update all wishes"
  on public.wishes for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins can delete wishes"
  on public.wishes for delete
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can view all orders" on public.orders;
drop policy if exists "Admins can update all orders" on public.orders;

create policy "Admins can view all orders"
  on public.orders for select
  using (public.is_admin(auth.uid()));

create policy "Admins can update all orders"
  on public.orders for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage music tracks" on public.music_tracks;
create policy "Admins can manage music tracks"
  on public.music_tracks for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_activity_logs enable row level security;

create index if not exists admin_activity_logs_admin_user_id_idx
  on public.admin_activity_logs(admin_user_id, created_at desc);

create index if not exists admin_activity_logs_target_idx
  on public.admin_activity_logs(target_type, target_id);

drop policy if exists "Admins can read activity logs" on public.admin_activity_logs;
drop policy if exists "Admins can create activity logs" on public.admin_activity_logs;

create policy "Admins can read activity logs"
  on public.admin_activity_logs for select
  using (public.is_admin(auth.uid()));

create policy "Admins can create activity logs"
  on public.admin_activity_logs for insert
  with check (public.is_admin(auth.uid()) and admin_user_id = auth.uid());

create or replace view public.admin_platform_metrics
with (security_invoker = true)
as
select
  (select count(*) from public.profiles)::bigint as total_users,
  (select count(*) from public.wishes)::bigint as total_wishes,
  (select count(*) from public.wishes where status = 'active')::bigint as active_wishes,
  (select count(*) from public.wishes where status = 'expired')::bigint as expired_wishes,
  (select count(*) from public.orders)::bigint as total_orders,
  (select count(*) from public.orders where status = 'paid')::bigint as paid_orders,
  coalesce((select sum(amount_paise) from public.orders where status = 'paid'), 0)::bigint as total_revenue_paise,
  (select count(*) from public.templates)::bigint as total_templates,
  (select count(*) from public.templates where is_active = true)::bigint as active_templates,
  coalesce((
    select count(*)
    from storage.objects
    where bucket_id in ('wish-photos', 'wish-music')
  ), 0)::bigint as storage_objects,
  coalesce((
    select sum(coalesce((metadata->>'size')::bigint, 0))
    from storage.objects
    where bucket_id in ('wish-photos', 'wish-music')
  ), 0)::bigint as storage_bytes
where public.is_admin(auth.uid());

notify pgrst, 'reload schema';
