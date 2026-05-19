insert into storage.buckets (id, name, public) values ('wish-photos', 'wish-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) values ('wish-music', 'wish-music', true)
on conflict (id) do nothing;

create policy "Anyone can read wish photos"
  on storage.objects for select using (bucket_id = 'wish-photos');

create policy "Auth users can upload wish photos"
  on storage.objects for insert
  with check (bucket_id = 'wish-photos' and auth.role() = 'authenticated');

create policy "Anyone can read wish music"
  on storage.objects for select using (bucket_id = 'wish-music');

create policy "Auth users can upload wish music"
  on storage.objects for insert
  with check (bucket_id = 'wish-music' and auth.role() = 'authenticated');
