create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');

create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  wish_id uuid references public.wishes(id) on delete cascade not null,
  template_id uuid references public.templates(id) not null,
  amount_paise integer not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status order_status default 'pending',
  created_at timestamptz default now(),
  paid_at timestamptz
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "Users can create own pending orders"
  on public.orders for insert with check (auth.uid() = user_id and status = 'pending');

create index orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
create index orders_razorpay_order_id_idx on public.orders (razorpay_order_id);
