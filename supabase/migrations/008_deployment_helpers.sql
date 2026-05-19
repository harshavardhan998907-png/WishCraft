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
    expires_at = now() + interval '7 days'
  where id = target_wish_id;
end;
$$;
