create table if not exists public.payment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  wish_id uuid references public.wishes(id) on delete set null,
  razorpay_order_id text,
  razorpay_payment_id text,
  event_type text not null,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  signature_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_event_logs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  duplicate_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_paid_at_idx on public.orders(paid_at);
create index if not exists payment_audit_logs_created_at_idx on public.payment_audit_logs(created_at desc);
create index if not exists payment_audit_logs_order_id_idx on public.payment_audit_logs(order_id, created_at desc);
create index if not exists webhook_event_logs_event_id_idx on public.webhook_event_logs(provider, event_id);
create index if not exists refund_requests_order_id_idx on public.refund_requests(order_id);
create index if not exists refund_requests_user_id_idx on public.refund_requests(user_id, requested_at desc);

create or replace function public.prevent_payment_audit_log_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'payment_audit_logs are immutable';
end;
$$;

drop trigger if exists payment_audit_logs_immutable_update on public.payment_audit_logs;
create trigger payment_audit_logs_immutable_update
before update on public.payment_audit_logs
for each row execute function public.prevent_payment_audit_log_changes();

drop trigger if exists payment_audit_logs_immutable_delete on public.payment_audit_logs;
create trigger payment_audit_logs_immutable_delete
before delete on public.payment_audit_logs
for each row execute function public.prevent_payment_audit_log_changes();

create or replace function public.activate_paid_wish(
  target_order_id uuid,
  target_wish_id uuid,
  payment_id text,
  payment_signature text
)
returns void
language plpgsql
security definer
as $$
declare
  existing_order public.orders%rowtype;
begin
  select *
  into existing_order
  from public.orders
  where id = target_order_id
    and wish_id = target_wish_id
  for update;

  if not found then
    raise exception 'Order not found for wish';
  end if;

  if existing_order.status = 'paid' then
    return;
  end if;

  if existing_order.status <> 'pending' then
    raise exception 'Only pending orders can be activated';
  end if;

  update public.orders
  set
    status = 'paid',
    razorpay_payment_id = coalesce(public.orders.razorpay_payment_id, payment_id),
    razorpay_signature = coalesce(public.orders.razorpay_signature, payment_signature),
    paid_at = coalesce(public.orders.paid_at, now())
  where id = target_order_id;

  update public.wishes
  set
    status = 'active',
    is_paid = true,
    activated_at = coalesce(public.wishes.activated_at, now()),
    expires_at = coalesce(public.wishes.expires_at, now() + interval '7 days')
  where id = target_wish_id
    and status <> 'active';
end;
$$;

create or replace function public.mark_payment_failed(
  target_order_id uuid,
  failure_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  update public.orders
  set status = 'failed'
  where id = target_order_id
    and status = 'pending';

  insert into public.payment_audit_logs (
    order_id,
    wish_id,
    razorpay_order_id,
    razorpay_payment_id,
    event_type,
    status,
    payload,
    signature_verified
  )
  select
    orders.id,
    orders.wish_id,
    orders.razorpay_order_id,
    orders.razorpay_payment_id,
    'payment_failed',
    orders.status::text,
    failure_payload,
    false
  from public.orders
  where orders.id = target_order_id;
end;
$$;

create or replace function public.increment_webhook_duplicate_count(
  target_provider text,
  target_event_id text
)
returns void
language plpgsql
security definer
as $$
begin
  update public.webhook_event_logs
  set duplicate_count = duplicate_count + 1
  where provider = target_provider
    and event_id = target_event_id;
end;
$$;

revoke execute on function public.activate_paid_wish(uuid, uuid, text, text) from public;
revoke execute on function public.activate_paid_wish(uuid, uuid, text, text) from authenticated;
grant execute on function public.activate_paid_wish(uuid, uuid, text, text) to service_role;

revoke execute on function public.mark_payment_failed(uuid, jsonb) from public;
revoke execute on function public.mark_payment_failed(uuid, jsonb) from authenticated;
grant execute on function public.mark_payment_failed(uuid, jsonb) to service_role;

revoke execute on function public.increment_webhook_duplicate_count(text, text) from public;
revoke execute on function public.increment_webhook_duplicate_count(text, text) from authenticated;
grant execute on function public.increment_webhook_duplicate_count(text, text) to service_role;

create or replace function public.request_refund(
  target_order_id uuid,
  refund_reason text
)
returns uuid
language plpgsql
security definer
as $$
declare
  refund_id uuid;
begin
  insert into public.refund_requests (order_id, user_id, reason)
  select orders.id, orders.user_id, refund_reason
  from public.orders
  where orders.id = target_order_id
    and orders.user_id = auth.uid()
    and orders.status = 'paid'
    and not exists (
      select 1
      from public.refund_requests
      where refund_requests.order_id = orders.id
        and refund_requests.status in ('pending', 'approved')
    )
  returning id into refund_id;

  if refund_id is null then
    raise exception 'Refund request could not be created';
  end if;

  insert into public.payment_audit_logs (order_id, event_type, status, payload, signature_verified)
  values (target_order_id, 'refund_requested', 'pending', jsonb_build_object('reason', refund_reason), false);

  return refund_id;
end;
$$;

revoke execute on function public.request_refund(uuid, text) from public;
grant execute on function public.request_refund(uuid, text) to authenticated;

drop view if exists public.payment_reconciliation_view;
create view public.payment_reconciliation_view
with (security_invoker = false)
as
select
  count(*) filter (where orders.status = 'paid')::integer as paid_orders,
  count(*) filter (where orders.status = 'failed')::integer as failed_orders,
  count(*) filter (where orders.status = 'pending')::integer as pending_orders,
  (select count(*)::integer from public.refund_requests) as refund_requests,
  (select coalesce(sum(duplicate_count), 0)::integer from public.webhook_event_logs) as duplicate_webhooks,
  coalesce(sum(orders.amount_paise) filter (where orders.status = 'paid'), 0)::integer as total_revenue
from public.orders
where public.is_admin(auth.uid());

alter table public.payment_audit_logs enable row level security;
alter table public.webhook_event_logs enable row level security;
alter table public.refund_requests enable row level security;

drop policy if exists "Users can read own payment audit logs" on public.payment_audit_logs;
drop policy if exists "Admins can read payment audit logs" on public.payment_audit_logs;
drop policy if exists "Admins can insert payment audit logs" on public.payment_audit_logs;

create policy "Users can read own payment audit logs"
  on public.payment_audit_logs for select
  using (
    exists (
      select 1
      from public.orders
      where orders.id = payment_audit_logs.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Admins can read payment audit logs"
  on public.payment_audit_logs for select
  using (public.is_admin(auth.uid()));

create policy "Admins can insert payment audit logs"
  on public.payment_audit_logs for insert
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage webhook event logs" on public.webhook_event_logs;
create policy "Admins can manage webhook event logs"
  on public.webhook_event_logs for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Users can read own refund requests" on public.refund_requests;
drop policy if exists "Users can create own refund requests" on public.refund_requests;
drop policy if exists "Admins can manage refund requests" on public.refund_requests;

create policy "Users can read own refund requests"
  on public.refund_requests for select
  using (user_id = auth.uid());

create policy "Users can create own refund requests"
  on public.refund_requests for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.orders
      where orders.id = refund_requests.order_id
        and orders.user_id = auth.uid()
        and orders.status = 'paid'
    )
  );

create policy "Admins can manage refund requests"
  on public.refund_requests for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders"
  on public.orders for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

notify pgrst, 'reload schema';
