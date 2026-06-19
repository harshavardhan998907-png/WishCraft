insert into storage.buckets (id, name, public)
values ('templates-pending', 'templates-pending', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('templates-approved', 'templates-approved', true)
on conflict (id) do nothing;

drop policy if exists "Service role can upload pending template assets" on storage.objects;
drop policy if exists "Service role can read pending template assets" on storage.objects;
drop policy if exists "Service role can update pending template assets" on storage.objects;
drop policy if exists "Service role can delete pending template assets" on storage.objects;
drop policy if exists "Anyone can read approved template assets" on storage.objects;
drop policy if exists "Service role can upload approved template assets" on storage.objects;
drop policy if exists "Service role can update approved template assets" on storage.objects;
drop policy if exists "Service role can delete approved template assets" on storage.objects;

create policy "Service role can upload pending template assets"
  on storage.objects for insert
  with check (
    bucket_id = 'templates-pending'
    and auth.role() = 'service_role'
  );

create policy "Service role can read pending template assets"
  on storage.objects for select
  using (
    bucket_id = 'templates-pending'
    and auth.role() = 'service_role'
  );

create policy "Service role can update pending template assets"
  on storage.objects for update
  using (
    bucket_id = 'templates-pending'
    and auth.role() = 'service_role'
  )
  with check (
    bucket_id = 'templates-pending'
    and auth.role() = 'service_role'
  );

create policy "Service role can delete pending template assets"
  on storage.objects for delete
  using (
    bucket_id = 'templates-pending'
    and auth.role() = 'service_role'
  );

create policy "Service role can upload approved template assets"
  on storage.objects for insert
  with check (
    bucket_id = 'templates-approved'
    and auth.role() = 'service_role'
  );

create policy "Service role can update approved template assets"
  on storage.objects for update
  using (
    bucket_id = 'templates-approved'
    and auth.role() = 'service_role'
  )
  with check (
    bucket_id = 'templates-approved'
    and auth.role() = 'service_role'
  );

create policy "Service role can delete approved template assets"
  on storage.objects for delete
  using (
    bucket_id = 'templates-approved'
    and auth.role() = 'service_role'
  );

create policy "Anyone can read approved template assets"
  on storage.objects for select
  using (bucket_id = 'templates-approved');
