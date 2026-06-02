create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  target_type text,
  target_id text,
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high', 'critical')),
  metadata jsonb default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  consent_version text not null,
  granted boolean not null default true,
  granted_at timestamptz not null default now()
);

create table if not exists public.data_export_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  export_status text not null default 'pending' check (export_status in ('pending', 'verified', 'processing', 'completed', 'rejected', 'expired')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_status text not null default 'pending' check (request_status in ('pending', 'verified', 'scheduled', 'cancelled', 'completed')),
  scheduled_deletion_at timestamptz not null default now() + interval '30 days',
  completed_at timestamptz
);

create table if not exists public.security_rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  rate_limit_key text not null,
  action text not null,
  event_count integer not null default 1,
  blocked boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_audit_logs_created_at_idx on public.security_audit_logs(created_at desc);
create index if not exists security_audit_logs_event_type_idx on public.security_audit_logs(event_type, created_at desc);
create index if not exists security_audit_logs_actor_idx on public.security_audit_logs(actor_user_id, created_at desc);
create index if not exists security_audit_logs_risk_idx on public.security_audit_logs(risk_level, created_at desc);
create index if not exists consent_records_user_idx on public.consent_records(user_id, granted_at desc);
create index if not exists data_export_requests_user_idx on public.data_export_requests(user_id, requested_at desc);
create index if not exists account_deletion_requests_user_idx on public.account_deletion_requests(user_id, scheduled_deletion_at desc);
create index if not exists security_rate_limit_events_key_idx on public.security_rate_limit_events(rate_limit_key, action, created_at desc);
create index if not exists security_rate_limit_events_blocked_idx on public.security_rate_limit_events(blocked, created_at desc);

create or replace function public.prevent_security_audit_log_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'security_audit_logs are immutable';
end;
$$;

drop trigger if exists security_audit_logs_immutable_update on public.security_audit_logs;
create trigger security_audit_logs_immutable_update
before update on public.security_audit_logs
for each row execute function public.prevent_security_audit_log_changes();

drop trigger if exists security_audit_logs_immutable_delete on public.security_audit_logs;
create trigger security_audit_logs_immutable_delete
before delete on public.security_audit_logs
for each row execute function public.prevent_security_audit_log_changes();

create or replace function public.create_security_audit_log(
  target_event_type text,
  target_type text default null,
  target_id text default null,
  target_risk_level text default 'low',
  target_metadata jsonb default '{}'::jsonb,
  target_ip_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
  normalized_risk text := lower(coalesce(target_risk_level, 'low'));
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if normalized_risk not in ('low', 'medium', 'high', 'critical') then
    normalized_risk := 'low';
  end if;

  insert into public.security_audit_logs (
    actor_user_id,
    event_type,
    target_type,
    target_id,
    risk_level,
    metadata,
    ip_hash
  )
  values (
    auth.uid(),
    public.sanitize_log_text(target_event_type, 120),
    nullif(public.sanitize_log_text(coalesce(target_type, ''), 80), ''),
    nullif(public.sanitize_log_text(coalesce(target_id, ''), 160), ''),
    normalized_risk,
    coalesce(target_metadata, '{}'::jsonb),
    nullif(public.sanitize_log_text(coalesce(target_ip_hash, ''), 160), '')
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

create or replace function public.create_data_export_request()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.data_export_requests (user_id, export_status)
  values (auth.uid(), 'pending')
  returning id into request_id;

  perform public.create_security_audit_log(
    'compliance_export_requested',
    'data_export_request',
    request_id::text,
    'medium',
    jsonb_build_object('requires_verification', true)
  );

  insert into public.analytics_events (event_name, user_id, metadata)
  values ('compliance_export_requested', auth.uid(), jsonb_build_object('request_id', request_id));

  return request_id;
end;
$$;

create or replace function public.create_account_deletion_request()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
  recovery_until timestamptz := now() + interval '30 days';
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.account_deletion_requests (user_id, request_status, scheduled_deletion_at)
  values (auth.uid(), 'scheduled', recovery_until)
  returning id into request_id;

  perform public.create_security_audit_log(
    'account_deletion_requested',
    'account_deletion_request',
    request_id::text,
    'high',
    jsonb_build_object('recovery_until', recovery_until)
  );

  insert into public.analytics_events (event_name, user_id, metadata)
  values ('account_deletion_requested', auth.uid(), jsonb_build_object('request_id', request_id, 'recovery_until', recovery_until));

  return request_id;
end;
$$;

create or replace function public.record_security_rate_limit_event(
  target_rate_limit_key text,
  target_action text,
  target_blocked boolean default false,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  insert into public.security_rate_limit_events (
    actor_user_id,
    rate_limit_key,
    action,
    blocked,
    metadata
  )
  values (
    auth.uid(),
    public.sanitize_log_text(target_rate_limit_key, 160),
    public.sanitize_log_text(target_action, 120),
    coalesce(target_blocked, false),
    coalesce(target_metadata, '{}'::jsonb)
  )
  returning id into event_id;

  if target_blocked then
    perform public.create_security_audit_log(
      'rate_limit_triggered',
      'rate_limit',
      event_id::text,
      'medium',
      jsonb_build_object('action', target_action, 'rate_limit_key', target_rate_limit_key)
    );

    insert into public.analytics_events (event_name, user_id, metadata)
    values ('rate_limit_triggered', auth.uid(), jsonb_build_object('action', target_action, 'event_id', event_id));
  end if;

  return event_id;
end;
$$;

drop view if exists public.security_monitoring_metrics;
create view public.security_monitoring_metrics as
select
  (select count(*)::integer from public.security_audit_logs where event_type = 'suspicious_login_detected' and created_at >= now() - interval '24 hours') as failed_login_attempts,
  (select count(*)::integer from public.security_audit_logs where risk_level in ('high', 'critical') and created_at >= now() - interval '24 hours') as suspicious_actions,
  (select count(*)::integer from public.security_audit_logs where event_type = 'admin_privilege_changed' and created_at >= now() - interval '30 days') as admin_privilege_changes,
  (select count(*)::integer from public.wish_messages where moderation_status in ('pending', 'hidden', 'rejected') and created_at >= now() - interval '7 days') as abuse_reports,
  (select count(*)::integer from public.security_rate_limit_events where blocked = true and created_at >= now() - interval '24 hours') as blocked_requests
where public.is_admin(auth.uid());

alter table public.security_audit_logs enable row level security;
alter table public.consent_records enable row level security;
alter table public.data_export_requests enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.security_rate_limit_events enable row level security;

drop policy if exists "Admins can read security audit logs" on public.security_audit_logs;
create policy "Admins can read security audit logs"
  on public.security_audit_logs for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Authenticated users can create security audit logs" on public.security_audit_logs;
create policy "Authenticated users can create security audit logs"
  on public.security_audit_logs for insert
  with check (auth.uid() = actor_user_id);

drop policy if exists "Users can read own consent records" on public.consent_records;
create policy "Users can read own consent records"
  on public.consent_records for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own consent records" on public.consent_records;
create policy "Users can create own consent records"
  on public.consent_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins can read consent records" on public.consent_records;
create policy "Admins can read consent records"
  on public.consent_records for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Users can read own data export requests" on public.data_export_requests;
create policy "Users can read own data export requests"
  on public.data_export_requests for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage data export requests" on public.data_export_requests;
create policy "Admins can manage data export requests"
  on public.data_export_requests for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Users can read own account deletion requests" on public.account_deletion_requests;
create policy "Users can read own account deletion requests"
  on public.account_deletion_requests for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage account deletion requests" on public.account_deletion_requests;
create policy "Admins can manage account deletion requests"
  on public.account_deletion_requests for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read security rate limit events" on public.security_rate_limit_events;
create policy "Admins can read security rate limit events"
  on public.security_rate_limit_events for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Authenticated users can create security rate limit events" on public.security_rate_limit_events;
create policy "Authenticated users can create security rate limit events"
  on public.security_rate_limit_events for insert
  with check (auth.uid() = actor_user_id);

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
      'wish_shared',
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
      'notification_sent',
      'notification_opened',
      'automation_job_completed',
      'automation_job_failed',
      'storage_warning',
      'system_health_recorded',
      'system_error_logged',
      'performance_metric_recorded',
      'cache_hit',
      'cache_miss',
      'suspicious_login_detected',
      'admin_privilege_changed',
      'compliance_export_requested',
      'account_deletion_requested',
      'rate_limit_triggered'
    )
    and (user_id is null or user_id = auth.uid())
    and coalesce(jsonb_typeof(metadata), 'object') = 'object'
  );

notify pgrst, 'reload schema';

revoke execute on function public.create_security_audit_log(text, text, text, text, jsonb, text) from public;
grant execute on function public.create_security_audit_log(text, text, text, text, jsonb, text) to authenticated;

revoke execute on function public.create_data_export_request() from public;
grant execute on function public.create_data_export_request() to authenticated;

revoke execute on function public.create_account_deletion_request() from public;
grant execute on function public.create_account_deletion_request() to authenticated;

revoke execute on function public.record_security_rate_limit_event(text, text, boolean, jsonb) from public;
grant execute on function public.record_security_rate_limit_event(text, text, boolean, jsonb) to authenticated;
