-- Adds the columns needed to publish creator-submitted (external) templates
-- once an admin approves them in the review queue.

alter table public.templates
  add column if not exists bundle_url text,
  add column if not exists is_external boolean default false,
  add column if not exists submission_id uuid references public.template_submissions(id);

create index if not exists templates_submission_id_idx
  on public.templates(submission_id);

create index if not exists templates_is_external_idx
  on public.templates(is_external);

notify pgrst, 'reload schema';
