begin;

delete from public.automation_logs
where job_id in (
  select id from public.scheduled_jobs
  where job_type like '%template%' or job_type like '%wish%'
);

delete from public.scheduled_jobs
where job_type like '%template%' or job_type like '%wish%';

delete from public.notifications
where notification_type like '%template%'
   or notification_type like '%wish%'
   or metadata ? 'template_id'
   or metadata ? 'wish_id';

delete from public.admin_activity_logs
where target_type in ('template', 'wish')
   or action like 'template_%'
   or action like 'wish_%'
   or metadata ? 'template_id'
   or metadata ? 'wish_id';

delete from public.ai_template_recommendations;
delete from public.template_category_mappings;
delete from public.template_categories;

delete from public.analytics_events
where template_id is not null
   or wish_id is not null
   or event_name like '%template%'
   or event_name like '%wish%';

delete from public.wish_reactions;
delete from public.wish_messages;
delete from public.wish_views;

update public.media_assets
set related_template_id = null
where related_template_id is not null;

delete from public.media_assets
where related_wish_id is not null
   or asset_type in ('template_thumbnail', 'template_preview');

delete from public.refund_requests;

alter table public.payment_audit_logs disable trigger payment_audit_logs_immutable_delete;
delete from public.payment_audit_logs;
alter table public.payment_audit_logs enable trigger payment_audit_logs_immutable_delete;

delete from public.orders;
delete from public.wishes;
delete from public.templates;
delete from public.music_tracks;

update public.creator_profiles
set total_template_views = 0,
    total_template_uses = 0;

delete from public.platform_intelligence_metrics
where metric_name ilike '%template%'
   or metric_category ilike '%template%';

commit;

notify pgrst, 'reload schema';
