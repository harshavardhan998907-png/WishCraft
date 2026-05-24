create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles(id) on delete cascade,
  related_wish_id uuid references public.wishes(id) on delete cascade,
  related_template_id uuid references public.templates(id) on delete set null,
  asset_type text not null,
  storage_bucket text not null,
  storage_path text not null,
  public_url text not null,
  mime_type text,
  original_size_bytes bigint,
  optimized_size_bytes bigint,
  optimization_status text default 'pending',
  is_orphaned boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.media_cleanup_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  assets_processed integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists media_assets_owner_user_id_idx on public.media_assets(owner_user_id);
create index if not exists media_assets_related_wish_id_idx on public.media_assets(related_wish_id);
create index if not exists media_assets_asset_type_idx on public.media_assets(asset_type);
create index if not exists media_assets_expires_at_idx on public.media_assets(expires_at);
create unique index if not exists media_assets_bucket_path_key on public.media_assets(storage_bucket, storage_path);
create index if not exists media_cleanup_jobs_started_at_idx on public.media_cleanup_jobs(started_at desc);

create or replace function public.mark_media_assets_linked(
  asset_urls text[],
  target_wish_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update public.media_assets
  set
    related_wish_id = target_wish_id,
    is_orphaned = false,
    expires_at = (
      select wishes.expires_at
      from public.wishes
      where wishes.id = target_wish_id
    )
  where public_url = any(asset_urls)
    and owner_user_id = auth.uid();
end;
$$;

create or replace function public.mark_expired_media_assets()
returns integer
language plpgsql
security definer
as $$
declare
  affected_count integer;
begin
  update public.media_assets
  set is_orphaned = true
  where is_orphaned = false
    and (
      expires_at < now()
      or exists (
        select 1
        from public.wishes
        where wishes.id = media_assets.related_wish_id
          and wishes.status in ('expired', 'deleted')
      )
    )
    and not exists (
      select 1
      from public.wishes
      where wishes.id = media_assets.related_wish_id
        and wishes.status = 'active'
        and wishes.is_paid = true
        and (wishes.expires_at is null or wishes.expires_at > now())
    );

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

revoke execute on function public.mark_media_assets_linked(text[], uuid) from public;
grant execute on function public.mark_media_assets_linked(text[], uuid) to authenticated;

revoke execute on function public.mark_expired_media_assets() from public;
revoke execute on function public.mark_expired_media_assets() from authenticated;
grant execute on function public.mark_expired_media_assets() to service_role;

drop view if exists public.storage_usage_metrics;
create view public.storage_usage_metrics
with (security_invoker = false)
as
select
  coalesce(sum(coalesce(media_assets.optimized_size_bytes, media_assets.original_size_bytes, 0)), 0)::bigint as total_storage_bytes,
  coalesce(sum(coalesce(media_assets.optimized_size_bytes, media_assets.original_size_bytes, 0)) filter (where media_assets.asset_type in ('image', 'image_thumbnail', 'template_thumbnail')), 0)::bigint as image_storage_bytes,
  coalesce(sum(coalesce(media_assets.optimized_size_bytes, media_assets.original_size_bytes, 0)) filter (where media_assets.asset_type = 'music'), 0)::bigint as music_storage_bytes,
  count(*) filter (where media_assets.is_orphaned = true)::integer as orphaned_assets,
  count(*) filter (where media_assets.expires_at is not null and media_assets.expires_at < now())::integer as expired_assets,
  (
    select coalesce(jsonb_agg(row_to_json(owner_usage)), '[]'::jsonb)
    from (
      select
        owner_user_id,
        count(*)::integer as asset_count,
        coalesce(sum(coalesce(optimized_size_bytes, original_size_bytes, 0)), 0)::bigint as storage_bytes
      from public.media_assets
      where owner_user_id is not null
      group by owner_user_id
      order by storage_bytes desc
    ) owner_usage
  ) as creator_storage_usage
from public.media_assets
where public.is_admin(auth.uid());

alter table public.media_assets enable row level security;
alter table public.media_cleanup_jobs enable row level security;

drop policy if exists "Users can manage own media assets" on public.media_assets;
drop policy if exists "Creators can manage own template media assets" on public.media_assets;
drop policy if exists "Admins can manage media assets" on public.media_assets;
drop policy if exists "Public can read public media assets" on public.media_assets;

create policy "Users can manage own media assets"
  on public.media_assets for all
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "Creators can manage own template media assets"
  on public.media_assets for all
  using (
    related_template_id in (
      select templates.id
      from public.templates
      join public.creator_profiles on creator_profiles.id = templates.creator_id
      where creator_profiles.user_id = auth.uid()
    )
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
  )
  with check (
    related_template_id in (
      select templates.id
      from public.templates
      join public.creator_profiles on creator_profiles.id = templates.creator_id
      where creator_profiles.user_id = auth.uid()
    )
    and public.get_user_role(auth.uid()) in ('creator', 'admin')
  );

create policy "Admins can manage media assets"
  on public.media_assets for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Public can read public media assets"
  on public.media_assets for select
  using (public_url is not null and is_orphaned = false);

drop policy if exists "Admins can manage media cleanup jobs" on public.media_cleanup_jobs;
create policy "Admins can manage media cleanup jobs"
  on public.media_cleanup_jobs for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

notify pgrst, 'reload schema';
