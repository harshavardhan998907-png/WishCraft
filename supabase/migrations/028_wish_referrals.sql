create table if not exists public.wish_referrals (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  template_slug text not null,
  converted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists wish_referrals_wish_id_idx on public.wish_referrals(wish_id, created_at desc);
create index if not exists wish_referrals_template_slug_idx on public.wish_referrals(template_slug, created_at desc);
create index if not exists wish_referrals_converted_idx on public.wish_referrals(converted, created_at desc);

alter table public.wish_referrals enable row level security;

drop policy if exists "Public can insert wish referrals" on public.wish_referrals;
create policy "Public can insert wish referrals"
  on public.wish_referrals for insert
  with check (
    exists (
      select 1
      from public.wishes
      where wishes.id = wish_id
        and wishes.status = 'active'
    )
  );

drop policy if exists "Public can mark wish referrals converted" on public.wish_referrals;
create policy "Public can mark wish referrals converted"
  on public.wish_referrals for update
  using (true)
  with check (converted = true);

drop policy if exists "Admins can manage wish referrals" on public.wish_referrals;
create policy "Admins can manage wish referrals"
  on public.wish_referrals for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

notify pgrst, 'reload schema';
