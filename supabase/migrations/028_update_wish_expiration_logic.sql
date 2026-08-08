-- Update expiration logic to strictly enforce a 24 hour lifespan for published wishes.

create or replace function public.activate_wish(
  target_order_id uuid,
  target_wish_id uuid,
  payment_id text default null,
  payment_signature text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set
    status = 'paid',
    razorpay_payment_id = payment_id,
    razorpay_signature = payment_signature,
    paid_at = now()
  where id = target_order_id;

  update public.wishes
  set
    status = 'active',
    is_paid = true,
    activated_at = now(),
    expires_at = coalesce(public.wishes.expires_at, now() + interval '24 hours')
  where id = target_wish_id;
end;
$$;


create or replace function public.activate_paid_wish(
  target_order_id uuid,
  target_wish_id uuid,
  payment_id text,
  payment_signature text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_order record;
begin
  select * into existing_order from public.orders where id = target_order_id for update;

  if not found then
    raise exception 'Order not found';
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
    expires_at = coalesce(public.wishes.expires_at, now() + interval '24 hours')
  where id = target_wish_id
    and status <> 'active';
end;
$$;
