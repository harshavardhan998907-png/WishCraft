create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  generation_type text not null,
  input_context jsonb not null default '{}'::jsonb,
  generated_output text,
  model_name text,
  token_usage integer,
  generation_status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_rate_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  generation_type text not null,
  request_count integer not null default 0,
  reset_at timestamptz not null default now() + interval '1 day',
  created_at timestamptz not null default now(),
  unique (user_id, generation_type)
);

create table if not exists public.ai_template_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  template_id uuid references public.templates(id) on delete cascade,
  recommendation_score numeric not null default 0,
  recommendation_reason text,
  created_at timestamptz not null default now(),
  unique (user_id, template_id)
);

create index if not exists ai_generation_logs_user_id_idx on public.ai_generation_logs(user_id, created_at desc);
create index if not exists ai_generation_logs_generation_type_idx on public.ai_generation_logs(generation_type);
create index if not exists ai_rate_limits_user_type_idx on public.ai_rate_limits(user_id, generation_type);
create index if not exists ai_template_recommendations_user_id_idx on public.ai_template_recommendations(user_id, created_at desc);
create index if not exists ai_template_recommendations_template_id_idx on public.ai_template_recommendations(template_id);

drop view if exists public.ai_usage_metrics;
create view public.ai_usage_metrics
with (security_invoker = false)
as
select
  count(*)::integer as total_generations,
  count(*) filter (where generation_status <> 'completed')::integer as failed_generations,
  coalesce((
    select jsonb_object_agg(generation_type, total_count)
    from (
      select generation_type, count(*)::integer as total_count
      from public.ai_generation_logs
      group by generation_type
      order by total_count desc
    ) popular_types
  ), '{}'::jsonb) as popular_generation_types,
  coalesce((
    select jsonb_object_agg(coalesce(role_usage.role, 'unknown'), role_usage.total_count)
    from (
      select profiles.role, count(*)::integer as total_count
      from public.ai_generation_logs
      left join public.profiles on profiles.id = ai_generation_logs.user_id
      group by profiles.role
    ) role_usage
  ), '{}'::jsonb) as ai_usage_by_role,
  coalesce((
    select count(distinct orders.id)::integer
    from public.orders
    join public.analytics_events on analytics_events.user_id = orders.user_id
    where orders.status = 'paid'
      and analytics_events.event_name in ('ai_generation_completed', 'template_recommendation_served')
      and orders.created_at >= analytics_events.created_at
      and orders.created_at <= analytics_events.created_at + interval '7 days'
  ), 0) as ai_conversion_impact
from public.ai_generation_logs
where public.is_admin(auth.uid());

alter table public.ai_generation_logs enable row level security;
alter table public.ai_rate_limits enable row level security;
alter table public.ai_template_recommendations enable row level security;

drop policy if exists "Users can read own AI generation logs" on public.ai_generation_logs;
drop policy if exists "Admins can read AI generation logs" on public.ai_generation_logs;

create policy "Users can read own AI generation logs"
  on public.ai_generation_logs for select
  using (user_id = auth.uid());

create policy "Admins can read AI generation logs"
  on public.ai_generation_logs for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Users can read own AI rate limits" on public.ai_rate_limits;
drop policy if exists "Admins can read AI rate limits" on public.ai_rate_limits;

create policy "Users can read own AI rate limits"
  on public.ai_rate_limits for select
  using (user_id = auth.uid());

create policy "Admins can read AI rate limits"
  on public.ai_rate_limits for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Users can read own AI recommendations" on public.ai_template_recommendations;
drop policy if exists "Admins can manage AI recommendations" on public.ai_template_recommendations;

create policy "Users can read own AI recommendations"
  on public.ai_template_recommendations for select
  using (user_id = auth.uid());

create policy "Admins can manage AI recommendations"
  on public.ai_template_recommendations for all
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
      'dashboard_opened',
      'admin_action'
    )
    and (user_id is null or user_id = auth.uid())
    and coalesce(jsonb_typeof(metadata), 'object') = 'object'
  );

notify pgrst, 'reload schema';
