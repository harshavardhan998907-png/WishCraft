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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    'user'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    role = public.profiles.role;
  return new;
end;
$$;

notify pgrst, 'reload schema';
