create table if not exists public.supported_locales (
  id uuid primary key default gen_random_uuid(),
  locale_code text not null unique,
  locale_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_locale_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  preferred_locale text not null default 'en',
  preferred_timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.ecosystem_api_keys (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  api_key_hash text not null unique,
  key_name text not null default 'Integration key',
  access_scope text[] not null default array['templates:read']::text[],
  is_active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.ecosystem_api_usage_events (
  id uuid primary key default gen_random_uuid(),
  api_key_id uuid references public.ecosystem_api_keys(id) on delete set null,
  owner_user_id uuid references public.profiles(id) on delete set null,
  endpoint text not null,
  request_status text not null default 'accepted',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ecosystem_webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint_url text not null,
  subscribed_events text[] not null default array['template.created']::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_intelligence_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_name text not null,
  metric_value numeric not null default 0,
  metric_category text not null,
  generated_at timestamptz not null default now()
);

create index if not exists supported_locales_active_idx on public.supported_locales(is_active, locale_code);
create index if not exists user_locale_preferences_user_idx on public.user_locale_preferences(user_id);
create index if not exists ecosystem_api_keys_owner_idx on public.ecosystem_api_keys(owner_user_id, is_active);
create index if not exists ecosystem_api_keys_hash_idx on public.ecosystem_api_keys(api_key_hash);
create index if not exists ecosystem_api_usage_key_idx on public.ecosystem_api_usage_events(api_key_id, created_at desc);
create index if not exists ecosystem_api_usage_owner_idx on public.ecosystem_api_usage_events(owner_user_id, created_at desc);
create index if not exists ecosystem_webhooks_owner_idx on public.ecosystem_webhook_subscriptions(owner_user_id, is_active);
create index if not exists platform_intelligence_category_idx on public.platform_intelligence_metrics(metric_category, generated_at desc);

insert into public.supported_locales (locale_code, locale_name, is_active)
values
  ('en', 'English', true),
  ('hi', 'Hindi', true),
  ('es', 'Spanish', true),
  ('fr', 'French', true)
on conflict (locale_code) do update set
  locale_name = excluded.locale_name,
  is_active = excluded.is_active;

create or replace function public.set_user_locale_preference(
  target_locale text,
  target_timezone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  preference_id uuid;
  normalized_locale text := lower(public.sanitize_log_text(coalesce(target_locale, 'en'), 16));
  normalized_timezone text := public.sanitize_log_text(coalesce(target_timezone, 'UTC'), 80);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.supported_locales
    where locale_code = normalized_locale
      and is_active = true
  ) then
    normalized_locale := 'en';
  end if;

  insert into public.user_locale_preferences (user_id, preferred_locale, preferred_timezone, updated_at)
  values (auth.uid(), normalized_locale, normalized_timezone, now())
  on conflict (user_id) do update set
    preferred_locale = excluded.preferred_locale,
    preferred_timezone = excluded.preferred_timezone,
    updated_at = now()
  returning id into preference_id;

  perform public.create_security_audit_log(
    'locale_changed',
    'user_locale_preferences',
    preference_id::text,
    'low',
    jsonb_build_object('locale', normalized_locale, 'timezone', normalized_timezone)
  );

  insert into public.analytics_events (event_name, user_id, metadata)
  values ('locale_changed', auth.uid(), jsonb_build_object('locale', normalized_locale, 'timezone', normalized_timezone));

  return preference_id;
end;
$$;

create or replace function public.create_ecosystem_api_key(
  target_key_name text,
  target_api_key_hash text,
  target_access_scope text[] default array['templates:read']::text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  key_id uuid;
  allowed_scopes text[] := array['templates:read', 'analytics:read', 'webhooks:write'];
  requested_scope text[] := coalesce(target_access_scope, array['templates:read']::text[]);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if target_api_key_hash is null or length(target_api_key_hash) < 40 then
    raise exception 'A secure API key hash is required';
  end if;

  if not requested_scope <@ allowed_scopes then
    raise exception 'Unsupported API key scope';
  end if;

  insert into public.ecosystem_api_keys (
    owner_user_id,
    api_key_hash,
    key_name,
    access_scope
  )
  values (
    auth.uid(),
    public.sanitize_log_text(target_api_key_hash, 160),
    public.sanitize_log_text(coalesce(target_key_name, 'Integration key'), 100),
    requested_scope
  )
  returning id into key_id;

  perform public.create_security_audit_log(
    'api_key_generated',
    'ecosystem_api_key',
    key_id::text,
    'high',
    jsonb_build_object('scope', requested_scope)
  );

  insert into public.analytics_events (event_name, user_id, metadata)
  values ('api_key_generated', auth.uid(), jsonb_build_object('key_id', key_id, 'scope', requested_scope));

  return key_id;
end;
$$;

create or replace function public.revoke_ecosystem_api_key(target_key_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public.ecosystem_api_keys
  set is_active = false,
      revoked_at = now()
  where id = target_key_id
    and (owner_user_id = auth.uid() or public.is_admin(auth.uid()));

  if not found then
    raise exception 'API key not found';
  end if;

  perform public.create_security_audit_log(
    'api_key_revoked',
    'ecosystem_api_key',
    target_key_id::text,
    'medium',
    '{}'::jsonb
  );
end;
$$;

create or replace function public.record_ecosystem_api_usage(
  target_api_key_id uuid,
  target_endpoint text,
  target_status text default 'accepted',
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  usage_id uuid;
  key_owner uuid;
begin
  select owner_user_id into key_owner
  from public.ecosystem_api_keys
  where id = target_api_key_id
    and is_active = true;

  if key_owner is null then
    raise exception 'Active API key required';
  end if;

  insert into public.ecosystem_api_usage_events (
    api_key_id,
    owner_user_id,
    endpoint,
    request_status,
    metadata
  )
  values (
    target_api_key_id,
    key_owner,
    public.sanitize_log_text(target_endpoint, 160),
    public.sanitize_log_text(coalesce(target_status, 'accepted'), 40),
    coalesce(target_metadata, '{}'::jsonb)
  )
  returning id into usage_id;

  insert into public.analytics_events (event_name, user_id, metadata)
  values ('integration_request_created', key_owner, jsonb_build_object('endpoint', target_endpoint, 'status', target_status));

  return usage_id;
end;
$$;

create or replace function public.create_platform_growth_snapshot()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  snapshot_id uuid;
  growth_value numeric;
begin
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    raise exception 'Only admins can generate platform intelligence snapshots';
  end if;

  select count(*)::numeric into growth_value
  from public.analytics_events
  where created_at >= now() - interval '30 days';

  insert into public.platform_intelligence_metrics (metric_name, metric_value, metric_category)
  values ('monthly_platform_activity', coalesce(growth_value, 0), 'growth')
  returning id into snapshot_id;

  if auth.uid() is not null then
    perform public.create_security_audit_log(
      'platform_growth_snapshot_generated',
      'platform_intelligence_metrics',
      snapshot_id::text,
      'medium',
      jsonb_build_object('metric_name', 'monthly_platform_activity')
    );

    insert into public.analytics_events (event_name, user_id, metadata)
    values ('platform_growth_snapshot_generated', auth.uid(), jsonb_build_object('snapshot_id', snapshot_id));
  end if;

  return snapshot_id;
end;
$$;

drop view if exists public.global_growth_metrics;
create view public.global_growth_metrics as
select
  jsonb_build_object(
    'unknown', (
      select count(*)::integer
      from public.analytics_events
      where created_at >= now() - interval '30 days'
    )
  ) as growth_by_region,
  (select count(*)::integer from public.creator_profiles where created_at >= now() - interval '30 days') as creator_growth,
  (select count(*)::integer from public.analytics_events where event_name in ('wish_reaction_added', 'wish_message_added', 'engagement_reaction_added', 'engagement_message_added') and created_at >= now() - interval '30 days') as engagement_growth,
  (select count(*)::integer from public.analytics_events where event_name in ('ai_generation_completed', 'template_recommendation_served') and created_at >= now() - interval '30 days') as ai_usage_growth,
  (select coalesce(sum(amount_paise), 0)::numeric / 100 from public.orders where status = 'paid' and created_at >= now() - interval '30 days') as revenue_growth,
  jsonb_build_object(
    'active_users_30d', (select count(distinct user_id)::integer from public.analytics_events where user_id is not null and created_at >= now() - interval '30 days'),
    'returning_users_30d', (
      select count(*)::integer
      from (
        select user_id
        from public.analytics_events
        where user_id is not null
          and created_at >= now() - interval '30 days'
        group by user_id
        having count(*) > 1
      ) retained
    )
  ) as retention_metrics,
  (select count(*)::integer from public.ecosystem_api_keys where is_active = true) as active_ecosystem_keys,
  (select count(*)::integer from public.ecosystem_api_usage_events where created_at >= now() - interval '30 days') as ecosystem_usage
where public.is_admin(auth.uid());

alter table public.supported_locales enable row level security;
alter table public.user_locale_preferences enable row level security;
alter table public.ecosystem_api_keys enable row level security;
alter table public.ecosystem_api_usage_events enable row level security;
alter table public.ecosystem_webhook_subscriptions enable row level security;
alter table public.platform_intelligence_metrics enable row level security;

drop policy if exists "Active locales are readable" on public.supported_locales;
create policy "Active locales are readable"
  on public.supported_locales for select
  using (is_active = true or public.is_admin(auth.uid()));

drop policy if exists "Admins can manage supported locales" on public.supported_locales;
create policy "Admins can manage supported locales"
  on public.supported_locales for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Users can manage own locale preferences" on public.user_locale_preferences;
create policy "Users can manage own locale preferences"
  on public.user_locale_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins can read locale preferences" on public.user_locale_preferences;
create policy "Admins can read locale preferences"
  on public.user_locale_preferences for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Users can manage own ecosystem API keys" on public.ecosystem_api_keys;
drop policy if exists "Users can read own ecosystem API keys" on public.ecosystem_api_keys;
create policy "Users can read own ecosystem API keys"
  on public.ecosystem_api_keys for select
  using (auth.uid() = owner_user_id);

drop policy if exists "Admins can read ecosystem API keys" on public.ecosystem_api_keys;
create policy "Admins can read ecosystem API keys"
  on public.ecosystem_api_keys for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Owners can read ecosystem API usage" on public.ecosystem_api_usage_events;
create policy "Owners can read ecosystem API usage"
  on public.ecosystem_api_usage_events for select
  using (auth.uid() = owner_user_id or public.is_admin(auth.uid()));

drop policy if exists "Users can manage own webhook subscriptions" on public.ecosystem_webhook_subscriptions;
create policy "Users can manage own webhook subscriptions"
  on public.ecosystem_webhook_subscriptions for all
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "Admins can read platform intelligence metrics" on public.platform_intelligence_metrics;
create policy "Admins can read platform intelligence metrics"
  on public.platform_intelligence_metrics for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can create platform intelligence metrics" on public.platform_intelligence_metrics;
create policy "Admins can create platform intelligence metrics"
  on public.platform_intelligence_metrics for insert
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
      'admin_action',
      'creator_template_created',
      'creator_template_updated',
      'creator_template_submitted',
      'creator_template_published',
      'creator_template_hidden',
      'creator_profile_updated',
      'creator_analytics_viewed',
      'media_uploaded',
      'media_cleanup_completed',
      'media_cleanup_failed',
      'engagement_reaction_added',
      'engagement_message_added',
      'engagement_message_hidden',
      'automation_job_completed',
      'system_health_recorded',
      'system_error_logged',
      'performance_metric_recorded',
      'suspicious_login_detected',
      'admin_privilege_changed',
      'compliance_export_requested',
      'account_deletion_requested',
      'rate_limit_triggered',
      'locale_changed',
      'api_key_generated',
      'platform_growth_snapshot_generated',
      'regional_growth_detected',
      'integration_request_created'
    )
    and (user_id is null or user_id = auth.uid())
    and coalesce(jsonb_typeof(metadata), 'object') = 'object'
  );

revoke execute on function public.set_user_locale_preference(text, text) from public;
grant execute on function public.set_user_locale_preference(text, text) to authenticated;

revoke execute on function public.create_ecosystem_api_key(text, text, text[]) from public;
grant execute on function public.create_ecosystem_api_key(text, text, text[]) to authenticated;

revoke execute on function public.revoke_ecosystem_api_key(uuid) from public;
grant execute on function public.revoke_ecosystem_api_key(uuid) to authenticated;

revoke execute on function public.record_ecosystem_api_usage(uuid, text, text, jsonb) from public;
grant execute on function public.record_ecosystem_api_usage(uuid, text, text, jsonb) to service_role;

revoke execute on function public.create_platform_growth_snapshot() from public;
grant execute on function public.create_platform_growth_snapshot() to authenticated, service_role;

notify pgrst, 'reload schema';
