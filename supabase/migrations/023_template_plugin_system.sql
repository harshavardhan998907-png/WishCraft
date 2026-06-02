do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'template_renderer_type'
  ) then
    create type public.template_renderer_type as enum ('react-component');
  end if;
end $$;

alter table public.templates
  add column if not exists description text,
  add column if not exists renderer_type public.template_renderer_type not null default 'react-component',
  add column if not exists component_key text,
  add column if not exists manifest_json jsonb not null default '{}'::jsonb,
  add column if not exists preview_video_url text,
  add column if not exists storage_prefix text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid references public.profiles(id);

update public.templates
set
  component_key = coalesce(component_key, component_name),
  manifest_json = case
    when manifest_json = '{}'::jsonb then jsonb_build_object(
      'id', id::text,
      'slug', slug,
      'name', name,
      'category', occasion::text,
      'tier', tier::text,
      'price', price_paise,
      'componentKey', component_name,
      'rendererType', renderer_type::text,
      'status', coalesce(status::text, case when is_active then 'published' else 'hidden' end)
    )
    else manifest_json
  end
where component_key is null
   or manifest_json = '{}'::jsonb;

with ranked_template_components as (
  select
    id,
    component_key,
    row_number() over (
      partition by component_key
      order by
        case when is_active = true and coalesce(status::text, 'published') = 'published' then 0 else 1 end,
        created_at asc,
        id asc
    ) as duplicate_rank
  from public.templates
)
update public.templates
set component_key = left(
  ranked_template_components.component_key || '-' || replace(public.templates.id::text, '-', ''),
  120
)
from ranked_template_components
where public.templates.id = ranked_template_components.id
  and ranked_template_components.duplicate_rank > 1;

update public.templates
set manifest_json = jsonb_set(
  coalesce(manifest_json, '{}'::jsonb),
  '{componentKey}',
  to_jsonb(component_key),
  true
)
where manifest_json->>'componentKey' is distinct from component_key;

alter table public.templates
  alter column component_key set not null;

create unique index if not exists templates_component_key_key
  on public.templates(component_key);

create index if not exists templates_plugin_public_idx
  on public.templates(status, is_active, occasion, tier);

create index if not exists templates_manifest_json_gin_idx
  on public.templates using gin(manifest_json);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_templates_updated_at on public.templates;
create trigger set_templates_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'templates',
  'templates',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/json']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read template plugin assets" on storage.objects;
drop policy if exists "Admins can upload template plugin assets" on storage.objects;
drop policy if exists "Admins can update template plugin assets" on storage.objects;
drop policy if exists "Admins can delete template plugin assets" on storage.objects;

create policy "Anyone can read template plugin assets"
  on storage.objects for select
  using (bucket_id = 'templates');

create policy "Admins can upload template plugin assets"
  on storage.objects for insert
  with check (
    bucket_id = 'templates'
    and public.is_admin(auth.uid())
    and (
      name like 'thumbnails/%'
      or name like 'previews/%'
      or name like 'assets/%'
    )
  );

create policy "Admins can update template plugin assets"
  on storage.objects for update
  using (bucket_id = 'templates' and public.is_admin(auth.uid()))
  with check (bucket_id = 'templates' and public.is_admin(auth.uid()));

create policy "Admins can delete template plugin assets"
  on storage.objects for delete
  using (bucket_id = 'templates' and public.is_admin(auth.uid()));

drop policy if exists "Public can read published templates" on public.templates;
create policy "Public can read published templates"
  on public.templates for select
  using (is_active = true and status = 'published');

drop policy if exists "Admins can manage templates" on public.templates;
create policy "Admins can manage templates"
  on public.templates for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

notify pgrst, 'reload schema';
