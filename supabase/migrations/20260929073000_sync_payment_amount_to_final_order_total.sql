-- Velora Restore-Test only.
-- Canonical payment rows must mirror the final order total after commercial
-- adjustments (coupon/promotion/gift card). The payment attempt itself already
-- reads orders.total; this keeps the payment ledger row coherent too.

create or replace function public.velora_set_order_payment_method(
  p_order_id uuid,
  p_payment_method_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_order public.orders;
  v_method public.payment_methods;
  v_route record;
  v_country text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_order
  from public.orders
  where id=p_order_id and customer_id=v_uid
  for update;

  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.payment_status::text<>'pending' then raise exception 'PAYMENT_STATUS_LOCKED'; end if;

  select * into v_method
  from public.payment_methods
  where id=p_payment_method_id and is_active=true;

  if not found then raise exception 'PAYMENT_METHOD_NOT_AVAILABLE'; end if;

  select upper(coalesce(nullif(trim(country_code),''),'EG'))
    into v_country
  from public.profiles
  where id=v_uid;

  v_country:=coalesce(v_country,'EG');

  select *
    into v_route
  from public.velora_get_payment_route(
    v_country,
    v_order.currency,
    p_payment_method_id,
    v_order.total
  )
  where (
    lower(v_method.code)='cash_on_delivery'
    or (lower(v_method.code)='card' and lower(provider_code)='paymob' and lower(environment)='test')
  )
  order by priority
  limit 1;

  if not found then raise exception 'PAYMENT_METHOD_NOT_OPERATIONAL'; end if;

  update public.payments
  set provider=lower(v_route.provider_code),
      method=lower(v_method.code),
      amount=v_order.total,
      currency=v_order.currency,
      status='pending',
      updated_at=now()
  where order_id=p_order_id
    and status='pending';

  if not found then
    insert into public.payments(
      order_id,provider,amount,currency,status,method
    )
    values(
      p_order_id,
      lower(v_route.provider_code),
      v_order.total,
      v_order.currency,
      'pending',
      lower(v_method.code)
    );
  end if;

  insert into public.audit_logs(
    actor_id,action,entity_type,entity_id,metadata
  )
  values(
    v_uid,
    'order_payment_method_selected',
    'order',
    p_order_id,
    jsonb_build_object(
      'payment_method',v_method.code,
      'provider',v_route.provider_code,
      'currency',v_order.currency,
      'amount',v_order.total,
      'payment_amount_synced_to_order_total',true
    )
  );

  return jsonb_build_object(
    'ok',true,
    'order_id',p_order_id,
    'payment_method_id',p_payment_method_id,
    'payment_method',v_method.code,
    'provider_code',v_route.provider_code,
    'currency',v_order.currency,
    'amount',v_order.total
  );
end;
$function$;
