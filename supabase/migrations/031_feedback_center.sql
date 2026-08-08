-- Migration 031: Create Feedback Center tables (reviews, feature_requests, bug_reports)

-- Create reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review text,
  title text,
  platform text not null default 'web',
  app_version text,
  created_at timestamptz not null default now()
);

-- Create feature_requests table
create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null,
  priority text not null check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

-- Create bug_reports table
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  page text not null,
  severity text not null check (severity in ('Low', 'Medium', 'High', 'Critical')),
  expected_behavior text not null,
  actual_behavior text not null,
  screenshot_url text,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists reviews_user_id_idx on public.reviews(user_id);
create index if not exists feature_requests_user_id_idx on public.feature_requests(user_id);
create index if not exists bug_reports_user_id_idx on public.bug_reports(user_id);

-- Enable RLS
alter table public.reviews enable row level security;
alter table public.feature_requests enable row level security;
alter table public.bug_reports enable row level security;

-- Policies for reviews
drop policy if exists "Authenticated users can insert reviews" on public.reviews;
create policy "Authenticated users can insert reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own reviews" on public.reviews;
create policy "Users can view their own reviews"
  on public.reviews for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage reviews" on public.reviews;
create policy "Admins can manage reviews"
  on public.reviews for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Policies for feature requests
drop policy if exists "Authenticated users can insert feature requests" on public.feature_requests;
create policy "Authenticated users can insert feature requests"
  on public.feature_requests for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own feature requests" on public.feature_requests;
create policy "Users can view their own feature requests"
  on public.feature_requests for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage feature requests" on public.feature_requests;
create policy "Admins can manage feature requests"
  on public.feature_requests for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Policies for bug reports
drop policy if exists "Authenticated users can insert bug reports" on public.bug_reports;
create policy "Authenticated users can insert bug reports"
  on public.bug_reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own bug reports" on public.bug_reports;
create policy "Users can view their own bug reports"
  on public.bug_reports for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage bug reports" on public.bug_reports;
create policy "Admins can manage bug reports"
  on public.bug_reports for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Reload schema notification
notify pgrst, 'reload schema';
