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
