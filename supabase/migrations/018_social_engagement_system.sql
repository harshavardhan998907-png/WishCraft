create table if not exists public.wish_reactions (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('heart', 'sparkles', 'laugh', 'wow', 'blessing')),
  session_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (wish_id, reaction_type, session_id)
);

create table if not exists public.wish_messages (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  sender_name text not null,
  sender_message text not null,
  is_hidden boolean not null default false,
  moderation_status text not null default 'approved' check (moderation_status in ('approved', 'pending', 'hidden', 'rejected')),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.engagement_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('message', 'reaction', 'wish')),
  target_id uuid not null,
  reason text not null,
  reporter_session_id text not null,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists wish_reactions_wish_id_idx on public.wish_reactions(wish_id, created_at desc);
create index if not exists wish_reactions_session_id_idx on public.wish_reactions(session_id, created_at desc);
create index if not exists wish_messages_wish_id_idx on public.wish_messages(wish_id, created_at desc);
create index if not exists wish_messages_moderation_status_idx on public.wish_messages(moderation_status, is_hidden);
create index if not exists wish_messages_session_id_idx on public.wish_messages(session_id, created_at desc);
create index if not exists engagement_reports_target_idx on public.engagement_reports(target_type, target_id);
create index if not exists engagement_reports_status_idx on public.engagement_reports(status, created_at desc);

create or replace function public.sanitize_engagement_text(raw_text text, max_length integer default 500)
returns text
language plpgsql
immutable
as $$
begin
  return left(
    trim(
      regexp_replace(
        regexp_replace(coalesce(raw_text, ''), '<[^>]*>', '', 'g'),
        '\s+',
        ' ',
        'g'
      )
    ),
    max_length
  );
end;
$$;

create or replace function public.engagement_needs_review(raw_text text)
returns boolean
language plpgsql
immutable
as $$
declare
  normalized text := lower(coalesce(raw_text, ''));
begin
  return normalized ~ '(spam|scam|abuse|hate|fuck|shit|bitch|http://|https://|www\.)';
end;
$$;

create or replace function public.add_wish_reaction(
  target_wish_id uuid,
  target_reaction_type text,
  target_session_id text
)
returns void
language plpgsql
security definer
as $$
begin
  if public.sanitize_engagement_text(target_session_id, 120) = '' then
    raise exception 'Session is required';
  end if;

  if not exists (
    select 1
    from public.wishes
    where id = target_wish_id
      and status = 'active'
  ) then
    raise exception 'Wish is not available for engagement';
  end if;

  if (
    select count(*)
    from public.wish_reactions
    where session_id = public.sanitize_engagement_text(target_session_id, 120)
      and created_at > now() - interval '1 hour'
  ) >= 30 then
    raise exception 'Reaction limit reached';
  end if;

  insert into public.wish_reactions (wish_id, reaction_type, session_id, user_id)
  values (
    target_wish_id,
    target_reaction_type,
    public.sanitize_engagement_text(target_session_id, 120),
    auth.uid()
  )
  on conflict (wish_id, reaction_type, session_id) do nothing;
end;
$$;

create or replace function public.add_wish_message(
  target_wish_id uuid,
  sender_name_input text,
  sender_message_input text,
  target_session_id text
)
returns uuid
language plpgsql
security definer
as $$
declare
  clean_name text := public.sanitize_engagement_text(sender_name_input, 80);
  clean_message text := public.sanitize_engagement_text(sender_message_input, 500);
  next_status text := 'approved';
  next_id uuid;
begin
  if clean_name = '' or clean_message = '' then
    raise exception 'Name and message are required';
  end if;

  if not exists (
    select 1
    from public.wishes
    where id = target_wish_id
      and status = 'active'
  ) then
    raise exception 'Wish is not available for messages';
  end if;

  if (
    select count(*)
    from public.wish_messages
    where session_id = public.sanitize_engagement_text(target_session_id, 120)
      and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Message limit reached';
  end if;

  if public.engagement_needs_review(clean_name || ' ' || clean_message) then
    next_status := 'pending';
  end if;

  insert into public.wish_messages (wish_id, sender_name, sender_message, moderation_status, is_hidden, user_id, session_id)
  values (
    target_wish_id,
    clean_name,
    clean_message,
    next_status,
    next_status <> 'approved',
    auth.uid(),
    public.sanitize_engagement_text(target_session_id, 120)
  )
  returning id into next_id;

  return next_id;
end;
$$;

create or replace function public.create_engagement_report(
  target_type_input text,
  target_id_input uuid,
  reason_input text,
  reporter_session_id_input text
)
returns uuid
language plpgsql
security definer
as $$
declare
  clean_reason text := public.sanitize_engagement_text(reason_input, 300);
  next_id uuid;
begin
  if clean_reason = '' then
    raise exception 'Report reason is required';
  end if;

  if (
    select count(*)
    from public.engagement_reports
    where reporter_session_id = public.sanitize_engagement_text(reporter_session_id_input, 120)
      and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'Report limit reached';
  end if;

  insert into public.engagement_reports (target_type, target_id, reason, reporter_session_id)
  values (
    target_type_input,
    target_id_input,
    clean_reason,
    public.sanitize_engagement_text(reporter_session_id_input, 120)
  )
  returning id into next_id;

  return next_id;
end;
$$;

revoke execute on function public.add_wish_reaction(uuid, text, text) from public;
grant execute on function public.add_wish_reaction(uuid, text, text) to anon, authenticated;

revoke execute on function public.add_wish_message(uuid, text, text, text) from public;
grant execute on function public.add_wish_message(uuid, text, text, text) to anon, authenticated;

revoke execute on function public.create_engagement_report(text, uuid, text, text) from public;
grant execute on function public.create_engagement_report(text, uuid, text, text) to anon, authenticated;

drop view if exists public.engagement_metrics;
drop view if exists public.creator_engagement_metrics;
create view public.engagement_metrics
with (security_invoker = false)
as
select
  (select count(*)::integer from public.wish_reactions) as total_reactions,
  (select count(*)::integer from public.wish_messages where is_hidden = false and moderation_status = 'approved') as total_messages,
  coalesce((
    select jsonb_agg(row_to_json(template_reactions))
    from (
      select templates.id as template_id, templates.name as template_name, count(wish_reactions.id)::integer as reaction_count
      from public.wish_reactions
      join public.wishes on wishes.id = wish_reactions.wish_id
      join public.templates on templates.id = wishes.template_id
      group by templates.id, templates.name
      order by reaction_count desc, templates.name asc
      limit 10
    ) template_reactions
  ), '[]'::jsonb) as most_reacted_templates,
  case
    when (select count(*) from public.wish_views) = 0 then 0::numeric
    else round((
      ((select count(*) from public.wish_reactions) + (select count(*) from public.wish_messages where is_hidden = false and moderation_status = 'approved'))::numeric
      / (select count(*) from public.wish_views)::numeric
    ) * 100, 2)
  end as engagement_rate,
  coalesce((
    select jsonb_agg(row_to_json(creator_scores))
    from (
      select
        creator_profiles.id as creator_id,
        creator_profiles.display_name,
        (count(distinct wish_reactions.id) + count(distinct wish_messages.id))::integer as engagement_score
      from public.creator_profiles
      join public.templates on templates.creator_id = creator_profiles.id
      left join public.wishes on wishes.template_id = templates.id
      left join public.wish_reactions on wish_reactions.wish_id = wishes.id
      left join public.wish_messages on wish_messages.wish_id = wishes.id and wish_messages.is_hidden = false and wish_messages.moderation_status = 'approved'
      group by creator_profiles.id, creator_profiles.display_name
      order by engagement_score desc, creator_profiles.display_name asc
      limit 20
    ) creator_scores
  ), '[]'::jsonb) as creator_engagement_score
where public.is_admin(auth.uid());

create view public.creator_engagement_metrics
with (security_invoker = false)
as
select
  templates.creator_id,
  templates.id as template_id,
  templates.name as template_name,
  templates.slug as template_slug,
  count(distinct wish_reactions.id)::integer as total_reactions,
  count(distinct wish_messages.id) filter (where wish_messages.is_hidden = false and wish_messages.moderation_status = 'approved')::integer as total_messages,
  (count(distinct wish_reactions.id) + count(distinct wish_messages.id) filter (where wish_messages.is_hidden = false and wish_messages.moderation_status = 'approved'))::integer as engagement_score
from public.templates
left join public.wishes on wishes.template_id = templates.id
left join public.wish_reactions on wish_reactions.wish_id = wishes.id
left join public.wish_messages on wish_messages.wish_id = wishes.id
where public.is_admin(auth.uid())
   or templates.creator_id in (
    select creator_profiles.id
    from public.creator_profiles
    where creator_profiles.user_id = auth.uid()
  )
group by templates.creator_id, templates.id, templates.name, templates.slug
order by engagement_score desc, templates.name asc;

alter table public.wish_reactions enable row level security;
alter table public.wish_messages enable row level security;
alter table public.engagement_reports enable row level security;

drop policy if exists "Public can read wish reactions" on public.wish_reactions;
drop policy if exists "Admins can manage wish reactions" on public.wish_reactions;

create policy "Public can read wish reactions"
  on public.wish_reactions for select
  using (true);

create policy "Admins can manage wish reactions"
  on public.wish_reactions for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Public can read approved wish messages" on public.wish_messages;
drop policy if exists "Admins can manage wish messages" on public.wish_messages;

create policy "Public can read approved wish messages"
  on public.wish_messages for select
  using (is_hidden = false and moderation_status = 'approved');

create policy "Admins can manage wish messages"
  on public.wish_messages for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage engagement reports" on public.engagement_reports;
create policy "Admins can manage engagement reports"
  on public.engagement_reports for all
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
      'dashboard_opened',
      'admin_action'
    )
    and (user_id is null or user_id = auth.uid())
    and coalesce(jsonb_typeof(metadata), 'object') = 'object'
  );

notify pgrst, 'reload schema';
