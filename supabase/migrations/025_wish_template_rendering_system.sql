alter table public.wishes
  add column if not exists template_slug text,
  add column if not exists template_version text not null default '1.0.0',
  add column if not exists occasion public.occasion_type,
  add column if not exists form_data jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

update public.wishes
set
  template_slug = coalesce(wishes.template_slug, templates.slug),
  occasion = coalesce(wishes.occasion, templates.occasion),
  template_version = coalesce(
    nullif(wishes.template_version, ''),
    templates.manifest_json->>'version',
    '1.0.0'
  ),
  form_data = case
    when wishes.form_data = '{}'::jsonb then jsonb_build_object(
      'recipient_name', wishes.recipient_name,
      'sender_name', wishes.sender_name,
      'message', coalesce(wishes.custom_message, ''),
      'photos', to_jsonb(coalesce(wishes.photo_urls, '{}'::text[])),
      'music', wishes.music_url
    )
    else wishes.form_data
  end
from public.templates
where wishes.template_id = templates.id;

alter table public.wishes
  alter column template_slug set not null,
  alter column occasion set not null;

create index if not exists wishes_template_slug_idx on public.wishes(template_slug);
create index if not exists wishes_template_version_idx on public.wishes(template_slug, template_version);
create index if not exists wishes_form_data_gin_idx on public.wishes using gin(form_data);

drop trigger if exists set_wishes_updated_at on public.wishes;
create trigger set_wishes_updated_at
  before update on public.wishes
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
