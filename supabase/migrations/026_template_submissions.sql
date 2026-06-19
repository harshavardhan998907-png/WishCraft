  create table if not exists public.template_submissions (
    id uuid primary key default gen_random_uuid(),
    creator_id uuid not null references auth.users(id),
    config jsonb not null,
    status text not null default 'pending',
    bundle_path text,
    preview_path text,
    rejection_note text,
    submitted_at timestamptz not null default now(),
    reviewed_at timestamptz,
    reviewed_by uuid references auth.users(id),
    constraint template_submissions_status_check
      check (status in ('pending', 'approved', 'rejected', 'active'))
  );

  create index if not exists template_submissions_creator_id_idx
    on public.template_submissions (creator_id);

  create index if not exists template_submissions_status_idx
    on public.template_submissions (status);

  create index if not exists template_submissions_creator_id_status_idx
    on public.template_submissions (creator_id, status);

  alter table public.template_submissions enable row level security;

  drop policy if exists "Creators can insert own template submissions" on public.template_submissions;
  drop policy if exists "Creators can select own template submissions" on public.template_submissions;
  drop policy if exists "Admins can select all template submissions" on public.template_submissions;
  drop policy if exists "Admins can update template submissions" on public.template_submissions;

  create policy "Creators can insert own template submissions"
    on public.template_submissions for insert
    with check (
      auth.uid() = creator_id
      and public.get_user_role(auth.uid()) in ('creator', 'admin')
    );

  create policy "Creators can select own template submissions"
    on public.template_submissions for select
    using (
      auth.uid() = creator_id
      and public.get_user_role(auth.uid()) in ('creator', 'admin')
    );

  create policy "Admins can select all template submissions"
    on public.template_submissions for select
    using (public.is_admin(auth.uid()));

  create policy "Admins can update template submissions"
    on public.template_submissions for update
    using (public.is_admin(auth.uid()))
    with check (public.is_admin(auth.uid()));

  create or replace function public.enforce_template_submission_admin_update()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
  begin
    if not public.is_admin(auth.uid()) then
      return new;
    end if;

    if new.creator_id is distinct from old.creator_id
      or new.config is distinct from old.config
      or new.bundle_path is distinct from old.bundle_path
      or new.preview_path is distinct from old.preview_path
      or new.submitted_at is distinct from old.submitted_at then
      raise exception 'Admins can only update status, rejection_note, reviewed_at, and reviewed_by.';
    end if;

    return new;
  end;
  $$;

  drop trigger if exists template_submissions_admin_update_guard on public.template_submissions;
  create trigger template_submissions_admin_update_guard
    before update on public.template_submissions
    for each row execute function public.enforce_template_submission_admin_update();
