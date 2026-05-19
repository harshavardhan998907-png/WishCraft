select 'templates' as check_name, count(*) as row_count
from public.templates
where slug in (
  'birthday-classic',
  'birthday-glow',
  'wedding-elegant',
  'anniversary-romantic',
  'festival-diwali',
  'graduation-celebration'
);

select slug, id, name, component_name, is_active
from public.templates
where slug = 'birthday-classic';

select slug, count(*) as duplicate_count
from public.templates
group by slug
having count(*) > 1;

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'templates', 'wishes', 'orders', 'music_tracks')
order by table_name;

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'templates', 'wishes', 'orders', 'music_tracks')
order by tablename, policyname;

select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('wish-photos', 'wish-music')
order by id;

select conrelid::regclass as table_name, conname as constraint_name, contype
from pg_constraint
where conrelid in ('public.templates'::regclass, 'public.wishes'::regclass, 'public.orders'::regclass)
order by table_name, constraint_name;
