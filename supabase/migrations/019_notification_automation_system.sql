create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  metadata jsonb default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email_enabled boolean not null default true,
  engagement_enabled boolean not null default true,
  creator_updates_enabled boolean not null default true,
  payment_notifications_enabled boolean not null default true,
  reminder_notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
  payload jsonb not null default '{}'::jsonb,
  retry_count integer not null default 0,
  scheduled_for timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.scheduled_jobs(id) on delete set null,
  execution_status text not null,
  error_message text,
  executed_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id, is_read, created_at desc);
create index if not exists notification_preferences_user_id_idx on public.notification_preferences(user_id);
create index if not exists scheduled_jobs_status_scheduled_idx on public.scheduled_jobs(status, scheduled_for);
create index if not exists scheduled_jobs_job_type_idx on public.scheduled_jobs(job_type);
create index if not exists automation_logs_job_id_idx on public.automation_logs(job_id, executed_at desc);
create index if not exists automation_logs_status_idx on public.automation_logs(execution_status, executed_at desc);

create or replace function public.notification_type_allowed(
  prefs public.notification_preferences,
  target_type text
)
returns boolean
language plpgsql
immutable
as $$
begin
  if target_type in ('payment_confirmation', 'payment_failed', 'refund_update') then
    return prefs.payment_notifications_enabled;
  end if;

  if target_type in ('wish_expiry_reminder', 'abandoned_wish_reminder', 'engagement_reminder') then
    return prefs.reminder_notifications_enabled;
  end if;

  if target_type in ('engagement_message', 'engagement_milestone', 'engagement_report') then
    return prefs.engagement_enabled;
  end if;

  if target_type in ('template_moderation', 'creator_alert', 'creator_report') then
    return prefs.creator_updates_enabled;
  end if;

  return true;
end;
$$;

create or replace function public.create_notification(
  target_user_id uuid,
  target_notification_type text,
  target_title text,
  target_message text,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  prefs public.notification_preferences%rowtype;
  notification_id uuid;
begin
  if target_user_id is null then
    raise exception 'Notification user is required';
  end if;

  if auth.uid() is not null and auth.uid() <> target_user_id and not public.is_admin(auth.uid()) then
    raise exception 'Cannot create notification for another user';
  end if;

  insert into public.notification_preferences (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;

  select *
  into prefs
  from public.notification_preferences
  where user_id = target_user_id;

  if not public.notification_type_allowed(prefs, target_notification_type) then
    return null;
  end if;

  insert into public.notifications (user_id, notification_type, title, message, metadata)
  values (
    target_user_id,
    left(public.sanitize_engagement_text(target_notification_type, 80), 80),
    left(public.sanitize_engagement_text(target_title, 140), 140),
    left(public.sanitize_engagement_text(target_message, 600), 600),
    coalesce(target_metadata, '{}'::jsonb)
  )
  returning id into notification_id;

  return notification_id;
end;
$$;

create or replace function public.notify_wish_owner(
  target_wish_id uuid,
  target_notification_type text,
  target_title text,
  target_message text,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  owner_id uuid;
begin
  select user_id into owner_id
  from public.wishes
  where id = target_wish_id;

  if owner_id is null then
    return null;
  end if;

  return public.create_notification(owner_id, target_notification_type, target_title, target_message, target_metadata);
end;
$$;

create or replace function public.enqueue_scheduled_job(
  target_job_type text,
  target_payload jsonb default '{}'::jsonb,
  target_scheduled_for timestamptz default now()
)
returns uuid
language plpgsql
security definer
as $$
declare
  job_id uuid;
  allowed_user_job boolean := target_job_type in ('wish_expiry_reminder', 'abandoned_wish_reminder');
begin
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    if not allowed_user_job
      or coalesce(target_payload ->> 'user_id', '') <> auth.uid()::text then
      raise exception 'Only admins can enqueue automation jobs';
    end if;
  end if;

  insert into public.scheduled_jobs (job_type, payload, scheduled_for)
  values (target_job_type, coalesce(target_payload, '{}'::jsonb), target_scheduled_for)
  returning id into job_id;

  return job_id;
end;
$$;

revoke execute on function public.create_notification(uuid, text, text, text, jsonb) from public;
grant execute on function public.create_notification(uuid, text, text, text, jsonb) to authenticated;

revoke execute on function public.notify_wish_owner(uuid, text, text, text, jsonb) from public;
grant execute on function public.notify_wish_owner(uuid, text, text, text, jsonb) to anon, authenticated;

revoke execute on function public.enqueue_scheduled_job(text, jsonb, timestamptz) from public;
grant execute on function public.enqueue_scheduled_job(text, jsonb, timestamptz) to authenticated;

drop view if exists public.notification_metrics;
create view public.notification_metrics
with (security_invoker = false)
as
select
  (select count(*)::integer from public.notifications) as total_notifications,
  (select count(*)::integer from public.notifications where is_read = false) as unread_notifications,
  (select count(*)::integer from public.scheduled_jobs where status in ('failed', 'dead_letter')) as failed_jobs,
  (select count(*)::integer from public.notifications where notification_type = 'engagement_reminder') as engagement_reminders_sent,
  (select count(*)::integer from public.notifications where notification_type in ('payment_confirmation', 'payment_failed', 'refund_update')) as payment_notifications_sent
where public.is_admin(auth.uid());

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.scheduled_jobs enable row level security;
alter table public.automation_logs enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Admins can manage notifications" on public.notifications;

create policy "Users can read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can manage notifications"
  on public.notifications for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Users can manage own notification preferences" on public.notification_preferences;
drop policy if exists "Admins can read notification preferences" on public.notification_preferences;

create policy "Users can manage own notification preferences"
  on public.notification_preferences for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can read notification preferences"
  on public.notification_preferences for select
  using (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage scheduled jobs" on public.scheduled_jobs;
create policy "Admins can manage scheduled jobs"
  on public.scheduled_jobs for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read automation logs" on public.automation_logs;
create policy "Admins can read automation logs"
  on public.automation_logs for select
  using (public.is_admin(auth.uid()));

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
      'dashboard_opened',
      'admin_action'
    )
    and (user_id is null or user_id = auth.uid())
    and coalesce(jsonb_typeof(metadata), 'object') = 'object'
  );

notify pgrst, 'reload schema';
