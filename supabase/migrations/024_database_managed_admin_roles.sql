alter table public.profiles
  add column if not exists role text not null default 'user';

update public.profiles
set role = 'user'
where role is null or role not in ('user', 'admin');

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles drop constraint profiles_role_check;
  end if;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'admin'));

create index if not exists profiles_role_idx on public.profiles(role);

create or replace function public.get_user_role(target_user uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select role
      from public.profiles
      where id = target_user
        and role in ('user', 'admin')
      limit 1
    ),
    'user'
  );
$$;

create or replace function public.is_admin(target_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.get_user_role(target_user) = 'admin', false);
$$;

drop function if exists public.claim_admin_role(text);

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
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
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
  using (auth.uid() = id and role = public.get_user_role(auth.uid()))
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

notify pgrst, 'reload schema';
