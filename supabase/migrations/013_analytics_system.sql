create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references public.profiles(id) on delete set null,
  wish_id uuid references public.wishes(id) on delete set null,
  template_id uuid references public.templates(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  country text,
  device_type text,
  referrer text,
  session_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.wish_views (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  viewer_session_id text,
  viewer_country text,
  device_type text,
  referrer text,
  viewed_at timestamptz not null default now()
);

create index if not exists analytics_events_created_at_idx
  on public.analytics_events(created_at desc);

create index if not exists analytics_events_event_name_idx
  on public.analytics_events(event_name);

create index if not exists analytics_events_template_id_idx
  on public.analytics_events(template_id);

create index if not exists analytics_events_wish_id_idx
  on public.analytics_events(wish_id);

create index if not exists wish_views_wish_id_idx
  on public.wish_views(wish_id);

create index if not exists wish_views_viewed_at_idx
  on public.wish_views(viewed_at desc);

alter table public.analytics_events enable row level security;
alter table public.wish_views enable row level security;

drop policy if exists "Public can insert analytics events" on public.analytics_events;
drop policy if exists "Admins can read analytics events" on public.analytics_events;
drop policy if exists "Public can insert wish views" on public.wish_views;
drop policy if exists "Admins can read wish views" on public.wish_views;

create policy "Public can insert analytics events"
  on public.analytics_events for insert
  with check (
    event_name in (
      'wish_opened',
      'wish_shared',
      'template_selected',
      'payment_success',
      'payment_failed',
      'photo_uploaded',
      'music_uploaded',
      'dashboard_opened',
      'admin_action'
    )
    and (user_id is null or user_id = auth.uid())
    and coalesce(jsonb_typeof(metadata), 'object') = 'object'
  );

create policy "Admins can read analytics events"
  on public.analytics_events for select
  using (public.is_admin(auth.uid()));

create policy "Public can insert wish views"
  on public.wish_views for insert
  with check (wish_id is not null);

create policy "Admins can read wish views"
  on public.wish_views for select
  using (public.is_admin(auth.uid()));

create or replace view public.analytics_daily_metrics
with (security_invoker = true)
as
with days as (
  select generate_series(
    date_trunc('day', now()) - interval '29 days',
    date_trunc('day', now()),
    interval '1 day'
  )::date as metric_date
)
select
  days.metric_date,
  coalesce((select count(*) from public.wish_views where viewed_at::date = days.metric_date), 0)::bigint as total_daily_views,
  coalesce((select count(*) from public.wishes where created_at::date = days.metric_date), 0)::bigint as total_daily_wishes,
  coalesce((select count(*) from public.orders where created_at::date = days.metric_date), 0)::bigint as total_daily_orders,
  coalesce((select sum(amount_paise) from public.orders where status = 'paid' and created_at::date = days.metric_date), 0)::bigint as total_daily_revenue,
  coalesce((
    select templates.name
    from public.analytics_events events
    join public.templates templates on templates.id = events.template_id
    where events.event_name = 'template_selected'
      and events.created_at::date = days.metric_date
    group by templates.name
    order by count(*) desc, templates.name asc
    limit 1
  ), 'None') as top_template,
  coalesce((select count(distinct user_id) from public.analytics_events where user_id is not null and created_at::date = days.metric_date), 0)::bigint as active_users
from days
where public.is_admin(auth.uid())
order by days.metric_date desc;

create or replace view public.template_performance_metrics
with (security_invoker = true)
as
select
  templates.id as template_id,
  templates.name as template_name,
  templates.slug as template_slug,
  coalesce(views.total_views, 0)::bigint as total_views,
  coalesce(uses.total_uses, 0)::bigint as total_uses,
  coalesce(conversions.total_conversions, 0)::bigint as total_conversions,
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
order by total_views desc, total_uses desc, templates.name asc;

notify pgrst, 'reload schema';
