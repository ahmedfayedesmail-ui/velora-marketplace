-- Velora Restore-Test only.
-- Keep pending payment placeholders coherent after coupon/promotion discounts.
-- The actual payment attempt also reads orders.total, so both representations
-- must agree before provider initialization.

create or replace function public.velora_apply_coupon_to_order(
  p_order_id uuid,
  p_coupon_code text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_order public.orders%rowtype;
  v_coupon public.coupons%rowtype;
  v_code text:=upper(trim(coalesce(p_coupon_code,'')));
  v_discount numeric:=0;
  v_customer_redemptions integer:=0;
  v_total_redemptions integer:=0;
  v_existing_orders integer:=0;
  v_new_total numeric:=0;
begin
  perform public.velora_assert_legal_acceptance(
    array['terms_of_service','privacy_policy','promotion_terms']
  );

  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_order_id is null or v_code='' then raise exception 'COUPON_IDENTIFIERS_REQUIRED'; end if;

  select * into v_order
  from public.orders
  where id=p_order_id and customer_id=v_uid
  for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  select * into v_coupon
  from public.coupons
  where code=v_code
  for update;
  if not found then raise exception 'COUPON_NOT_FOUND'; end if;

  if not v_coupon.is_active then raise exception 'COUPON_INACTIVE'; end if;
  if v_coupon.starts_at is not null and v_coupon.starts_at>now() then raise exception 'COUPON_NOT_STARTED'; end if;
  if v_coupon.expires_at is not null and v_coupon.expires_at<=now() then raise exception 'COUPON_EXPIRED'; end if;
  if v_coupon.currency_code is not null and upper(v_coupon.currency_code)<>upper(v_order.currency) then raise exception 'COUPON_CURRENCY_MISMATCH'; end if;
  if v_coupon.minimum_order_amount is not null and v_order.subtotal<v_coupon.minimum_order_amount then raise exception 'COUPON_MINIMUM_ORDER_NOT_MET'; end if;

  select count(*)::integer into v_total_redemptions
  from public.coupon_redemptions
  where coupon_id=v_coupon.id;
  if v_coupon.usage_limit is not null and v_total_redemptions>=v_coupon.usage_limit then raise exception 'COUPON_USAGE_LIMIT_REACHED'; end if;

  select count(*)::integer into v_customer_redemptions
  from public.coupon_redemptions
  where coupon_id=v_coupon.id and customer_id=v_uid;
  if v_coupon.customer_usage_limit is not null and v_customer_redemptions>=v_coupon.customer_usage_limit then raise exception 'COUPON_CUSTOMER_USAGE_LIMIT_REACHED'; end if;

  if v_coupon.first_order_only then
    select count(*)::integer into v_existing_orders
    from public.orders
    where customer_id=v_uid and id<>v_order.id and status not in ('cancelled','refunded');
    if v_existing_orders>0 then raise exception 'COUPON_FIRST_ORDER_ONLY'; end if;
  end if;

  if v_coupon.discount_type='percentage' then
    v_discount:=round(v_order.subtotal*v_coupon.discount_value/100,4);
  elsif v_coupon.discount_type='fixed' then
    v_discount:=least(v_coupon.discount_value,v_order.subtotal);
  else
    raise exception 'COUPON_TYPE_NOT_SUPPORTED';
  end if;

  if v_coupon.max_discount_amount is not null then
    v_discount:=least(v_discount,v_coupon.max_discount_amount);
  end if;

  v_discount:=greatest(0,least(v_discount,v_order.subtotal));
  v_new_total:=greatest(0,round(v_order.subtotal-v_discount+v_order.shipping,4));

  if exists(
    select 1 from public.coupon_redemptions
    where coupon_id=v_coupon.id and order_id=v_order.id
  ) then
    return jsonb_build_object(
      'ok',true,'reused',true,'order_id',v_order.id,
      'coupon_id',v_coupon.id,'code',v_coupon.code,
      'discount_amount',v_discount,'currency_code',v_order.currency,'total',v_new_total
    );
  end if;

  update public.orders
  set discount=v_discount,total=v_new_total,updated_at=now()
  where id=v_order.id;

  update public.payments
  set amount=v_new_total,
      currency=v_order.currency,
      updated_at=now()
  where order_id=v_order.id
    and status='pending';

  insert into public.coupon_redemptions(
    coupon_id,customer_id,order_id,discount_amount,currency_code,created_at
  )
  values(
    v_coupon.id,v_uid,v_order.id,v_discount,v_order.currency,now()
  );

  update public.coupons
  set used_count=used_count+1,updated_at=now()
  where id=v_coupon.id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,'coupon_redeemed','order',v_order.id,
    jsonb_build_object(
      'coupon_id',v_coupon.id,
      'coupon_code',v_coupon.code,
      'discount_amount',v_discount,
      'currency_code',v_order.currency,
      'pending_payment_amount_synced',true
    )
  );

  return jsonb_build_object(
    'ok',true,'reused',false,'order_id',v_order.id,'coupon_id',v_coupon.id,
    'code',v_coupon.code,'discount_amount',v_discount,
    'currency_code',v_order.currency,'total',v_new_total
  );
end;
$function$;


create or replace function public.velora_apply_best_promotion_to_order(
  p_order_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_order public.orders%rowtype;
  v_promotion public.promotions%rowtype;
  v_quote jsonb;
  v_discount numeric:=0;
  v_new_total numeric;
  v_total_count integer;
  v_customer_count integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_order
  from public.orders
  where id=p_order_id and customer_id=v_uid
  for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  v_quote:=public.velora_get_best_promotion(v_order.currency,v_order.subtotal);

  if coalesce((v_quote->>'ok')::boolean,false)=false then
    return jsonb_build_object(
      'ok',true,'applied',false,'order_id',v_order.id,
      'discount_amount',0,'total',v_order.total
    );
  end if;

  perform public.velora_assert_legal_acceptance(
    array['terms_of_service','privacy_policy','promotion_terms']
  );

  select * into v_promotion
  from public.promotions
  where id=(v_quote->>'promotion_id')::uuid
  for update;
  if not found then raise exception 'PROMOTION_NOT_FOUND'; end if;

  select count(*)::integer into v_total_count
  from public.promotion_redemptions
  where promotion_id=v_promotion.id;
  if v_promotion.usage_limit is not null and v_total_count>=v_promotion.usage_limit then raise exception 'PROMOTION_USAGE_LIMIT_REACHED'; end if;

  select count(*)::integer into v_customer_count
  from public.promotion_redemptions
  where promotion_id=v_promotion.id and customer_id=v_uid;
  if v_promotion.customer_usage_limit is not null and v_customer_count>=v_promotion.customer_usage_limit then raise exception 'PROMOTION_CUSTOMER_USAGE_LIMIT_REACHED'; end if;

  v_discount:=greatest(
    0,
    least(coalesce((v_quote->>'discount_amount')::numeric,0),v_order.subtotal)
  );
  v_new_total:=greatest(0,round(v_order.subtotal-v_discount+v_order.shipping,4));

  if exists(
    select 1 from public.promotion_redemptions
    where promotion_id=v_promotion.id and order_id=v_order.id
  ) then
    return jsonb_build_object(
      'ok',true,'applied',true,'reused',true,'order_id',v_order.id,
      'promotion_id',v_promotion.id,'discount_amount',v_discount,'total',v_new_total
    );
  end if;

  update public.orders
  set discount=v_discount,total=v_new_total,promotion_id=v_promotion.id,updated_at=now()
  where id=v_order.id;

  update public.payments
  set amount=v_new_total,
      currency=v_order.currency,
      updated_at=now()
  where order_id=v_order.id
    and status='pending';

  insert into public.promotion_redemptions(
    promotion_id,customer_id,order_id,discount_amount,currency_code,created_at
  )
  values(
    v_promotion.id,v_uid,v_order.id,v_discount,v_order.currency,now()
  );

  update public.promotions
  set used_count=used_count+1,updated_at=now()
  where id=v_promotion.id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,'promotion_redeemed','order',v_order.id,
    jsonb_build_object(
      'promotion_id',v_promotion.id,
      'promotion_code',v_promotion.code,
      'discount_amount',v_discount,
      'currency_code',v_order.currency,
      'stackable',v_promotion.stackable,
      'funding_source','platform',
      'pending_payment_amount_synced',true
    )
  );

  return jsonb_build_object(
    'ok',true,'applied',true,'reused',false,'order_id',v_order.id,
    'promotion_id',v_promotion.id,'promotion_code',v_promotion.code,
    'discount_amount',v_discount,'total',v_new_total
  );
end;
$function$;
