create table if not exists public.system_health_logs (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  health_status text not null check (health_status in ('healthy', 'degraded', 'unhealthy')),
  response_time_ms integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.error_tracking_logs (
  id uuid primary key default gen_random_uuid(),
  service_name text not null,
  error_type text not null,
  error_message text not null,
  stack_trace text,
  severity text not null default 'error' check (severity in ('info', 'warning', 'error', 'critical')),
  created_at timestamptz not null default now()
);

create table if not exists public.performance_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_value numeric not null,
  metric_unit text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cache_registry (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  cache_group text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists system_health_logs_service_created_idx
  on public.system_health_logs(service_name, created_at desc);

create index if not exists system_health_logs_status_idx
  on public.system_health_logs(health_status, created_at desc);

create index if not exists error_tracking_logs_service_created_idx
  on public.error_tracking_logs(service_name, created_at desc);

create index if not exists error_tracking_logs_severity_idx
  on public.error_tracking_logs(severity, created_at desc);

create index if not exists performance_metrics_name_created_idx
  on public.performance_metrics(metric_name, created_at desc);

create index if not exists cache_registry_group_expires_idx
  on public.cache_registry(cache_group, expires_at);

create or replace function public.sanitize_log_text(raw_text text, max_length integer default 1000)
returns text
language plpgsql
immutable
as $$
begin
  return left(
    trim(
      regexp_replace(
        regexp_replace(coalesce(raw_text, ''), '([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})', '[redacted-email]', 'g'),
        '(sk_live_[A-Za-z0-9_]+|sk_test_[A-Za-z0-9_]+|Bearer\s+[A-Za-z0-9._-]+)',
        '[redacted-secret]',
        'g'
      )
    ),
    max_length
  );
end;
$$;

create or replace function public.log_system_health(
  target_service_name text,
  target_health_status text,
  target_response_time_ms integer default null,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  log_id uuid;
begin
  insert into public.system_health_logs (service_name, health_status, response_time_ms, metadata)
  values (
    public.sanitize_log_text(target_service_name, 120),
    target_health_status,
    target_response_time_ms,
    coalesce(target_metadata, '{}'::jsonb)
  )
  returning id into log_id;

  return log_id;
end;
$$;

create or replace function public.log_production_error(
  target_service_name text,
  target_error_type text,
  target_error_message text,
  target_stack_trace text default null,
  target_severity text default 'error'
)
returns uuid
language plpgsql
security definer
as $$
declare
  log_id uuid;
begin
  insert into public.error_tracking_logs (service_name, error_type, error_message, stack_trace, severity)
  values (
    public.sanitize_log_text(target_service_name, 120),
    public.sanitize_log_text(target_error_type, 120),
    public.sanitize_log_text(target_error_message, 1000),
    nullif(public.sanitize_log_text(coalesce(target_stack_trace, ''), 2000), ''),
    target_severity
  )
  returning id into log_id;

  return log_id;
end;
$$;

create or replace function public.record_performance_metric(
  target_metric_name text,
  target_metric_value numeric,
  target_metric_unit text,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  metric_id uuid;
begin
  insert into public.performance_metrics (metric_name, metric_value, metric_unit, metadata)
  values (
    public.sanitize_log_text(target_metric_name, 120),
    target_metric_value,
    public.sanitize_log_text(target_metric_unit, 40),
    coalesce(target_metadata, '{}'::jsonb)
  )
  returning id into metric_id;

  return metric_id;
end;
$$;

create or replace function public.register_cache_key(
  target_cache_key text,
  target_cache_group text,
  target_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
as $$
declare
  cache_id uuid;
begin
  insert into public.cache_registry (cache_key, cache_group, expires_at)
  values (
    public.sanitize_log_text(target_cache_key, 240),
    public.sanitize_log_text(target_cache_group, 80),
    target_expires_at
  )
  on conflict (cache_key) do update set
    cache_group = excluded.cache_group,
    expires_at = excluded.expires_at
  returning id into cache_id;

  return cache_id;
end;
$$;

create or replace function public.purge_expired_cache_registry()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can purge cache registry';
  end if;

  delete from public.cache_registry
  where expires_at < now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke execute on function public.log_system_health(text, text, integer, jsonb) from public;
grant execute on function public.log_system_health(text, text, integer, jsonb) to anon, authenticated;

revoke execute on function public.log_production_error(text, text, text, text, text) from public;
grant execute on function public.log_production_error(text, text, text, text, text) to anon, authenticated;

revoke execute on function public.record_performance_metric(text, numeric, text, jsonb) from public;
grant execute on function public.record_performance_metric(text, numeric, text, jsonb) to anon, authenticated;

revoke execute on function public.register_cache_key(text, text, timestamptz) from public;
grant execute on function public.register_cache_key(text, text, timestamptz) to anon, authenticated;

revoke execute on function public.purge_expired_cache_registry() from public;
grant execute on function public.purge_expired_cache_registry() to authenticated;

drop view if exists public.production_metrics;
create view public.production_metrics
with (security_invoker = false)
as
select
  coalesce((
    select round(avg(response_time_ms), 2)
    from public.system_health_logs
    where created_at > now() - interval '24 hours'
      and response_time_ms is not null
  ), 0)::numeric as average_response_time,
  coalesce((
    select count(*)::integer
    from public.scheduled_jobs
    where status in ('failed', 'dead_letter')
  ), 0) as failed_jobs,
  coalesce((
    select round(
      (count(*) filter (where status = 'paid')::numeric / nullif(count(*) filter (where status in ('paid', 'failed')), 0)) * 100,
      2
    )
    from public.orders
  ), 0)::numeric as payment_success_rate,
  coalesce((
    select round(
      (count(*) filter (where generation_status <> 'completed')::numeric / nullif(count(*), 0)) * 100,
      2
    )
    from public.ai_generation_logs
  ), 0)::numeric as ai_failure_rate,
  coalesce((
    select jsonb_build_object(
      'pending', count(*) filter (where status = 'pending'),
      'processing', count(*) filter (where status = 'processing'),
      'failed', count(*) filter (where status in ('failed', 'dead_letter'))
    )
    from public.scheduled_jobs
  ), '{}'::jsonb) as queue_health,
  coalesce((
    select round(
      (count(*) filter (where event_name = 'cache_hit')::numeric / nullif(count(*) filter (where event_name in ('cache_hit', 'cache_miss')), 0)) * 100,
      2
    )
    from public.analytics_events
    where created_at > now() - interval '24 hours'
  ), 0)::numeric as cache_hit_ratio
where public.is_admin(auth.uid());

alter table public.system_health_logs enable row level security;
alter table public.error_tracking_logs enable row level security;
alter table public.performance_metrics enable row level security;
alter table public.cache_registry enable row level security;

drop policy if exists "Admins can read system health logs" on public.system_health_logs;
create policy "Admins can read system health logs"
  on public.system_health_logs for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read error tracking logs" on public.error_tracking_logs;
create policy "Admins can read error tracking logs"
  on public.error_tracking_logs for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read performance metrics" on public.performance_metrics;
create policy "Admins can read performance metrics"
  on public.performance_metrics for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage cache registry" on public.cache_registry;
create policy "Admins can manage cache registry"
  on public.cache_registry for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Public can insert analytics events" on public.analytics_events;
create policy "Public can insert analytics events"
  on public.analytics_events for insert
  with check (
    event_name in (
      'wish_opened',
      'wish_shared',
      'template_selected',
      'payment_success',
      'payment_failed',
      'refund_requested',
      'refund_completed',
      'webhook_received',
      'photo_uploaded',
      'music_uploaded',
      'image_optimized',
      'orphan_cleanup_completed',
      'storage_warning',
      'ai_generation_requested',
      'ai_generation_completed',
      'ai_generation_failed',
      'template_recommendation_served',
      'wish_reaction_added',
      'wish_message_added',
      'engagement_report_created',
      'engagement_hidden',
      'notification_sent',
      'notification_opened',
      'automation_job_executed',
      'automation_job_failed',
      'email_delivery_failed',
      'cache_hit',
      'cache_miss',
      'worker_failure',
      'worker_recovered',
      'production_error_logged',
      'dashboard_opened',
      'admin_action'
    )
    and (user_id is null or user_id = auth.uid())
    and coalesce(jsonb_typeof(metadata), 'object') = 'object'
  );

notify pgrst, 'reload schema';
