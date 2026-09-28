-- Bind Seller subscription pricing country to the approved store.
-- The browser may supply a country hint, but commercial pricing must use the
-- canonical approved store country to prevent cross-region price selection.

create or replace function public.velora_start_subscription_purchase(
  p_plan_id uuid,
  p_country_code text,
  p_billing_cycle text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
  v_store uuid;
  v_store_country text;
  v_country text := upper(trim(coalesce(p_country_code,'')));
  v_cycle text := lower(trim(coalesce(p_billing_cycle,'')));
  v_key text := trim(coalesce(p_idempotency_key,''));
  v_price record;
  v_plan public.subscription_plans%rowtype;
  v_existing public.seller_subscriptions%rowtype;
  v_sub public.seller_subscriptions%rowtype;
  v_method_id uuid;
  v_attempt record;
  v_attempt_status text;
begin
  perform public.velora_assert_legal_acceptance(
    array['seller_agreement','seller_subscription','seller_commission']
  );

  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_country !~ '^[A-Z]{2}$' then raise exception 'INVALID_COUNTRY_CODE'; end if;
  if v_cycle not in ('monthly','yearly') then raise exception 'INVALID_BILLING_CYCLE'; end if;
  if length(v_key)<8 or length(v_key)>200 then raise exception 'INVALID_IDEMPOTENCY_KEY'; end if;
  if p_plan_id is null then raise exception 'SUBSCRIPTION_PLAN_REQUIRED'; end if;

  select id
    into v_seller
  from public.sellers
  where user_id=v_uid
    and status='approved'
  limit 1;

  if v_seller is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;

  select id, upper(nullif(trim(country_code), ''))
    into v_store, v_store_country
  from public.stores
  where owner_id=v_uid
    and status='approved'
  order by created_at desc
  limit 1;

  if v_store is null then raise exception 'APPROVED_STORE_REQUIRED'; end if;
  if v_store_country is null then raise exception 'STORE_COUNTRY_NOT_CONFIGURED'; end if;
  if v_country <> v_store_country then
    raise exception 'SUBSCRIPTION_COUNTRY_MISMATCH';
  end if;

  v_country := v_store_country;

  select *
    into v_plan
  from public.subscription_plans
  where id=p_plan_id
    and is_active=true;

  if not found then raise exception 'SUBSCRIPTION_PLAN_NOT_FOUND'; end if;
  if v_plan.name='Free' then raise exception 'FREE_PLAN_DOES_NOT_REQUIRE_PAYMENT'; end if;

  perform 1
  from public.sellers
  where id=v_seller
  for update;

  select *
    into v_existing
  from public.seller_subscriptions
  where purchase_idempotency_key=v_key
  limit 1;

  if found then
    if v_existing.store_id<>v_store
       or v_existing.plan_id<>p_plan_id
       or v_existing.billing_cycle<>v_cycle then
      raise exception 'IDEMPOTENCY_MISMATCH';
    end if;

    select pa.id as attempt_id,
           pa.provider_id,
           pa.amount,
           pa.currency_code,
           pa.status
    into v_attempt
    from public.payment_attempts pa
    where pa.seller_subscription_id=v_existing.id
      and pa.purpose='subscription'
    order by pa.created_at desc
    limit 1;

    return jsonb_build_object(
      'ok',true,
      'reused',true,
      'subscription_id',v_existing.id,
      'subscription_status',v_existing.status,
      'payment_attempt_id',v_attempt.attempt_id,
      'provider_id',v_attempt.provider_id,
      'amount',v_attempt.amount,
      'currency_code',v_attempt.currency_code,
      'payment_attempt_status',v_attempt.status
    );
  end if;

  if exists(
    select 1
    from public.seller_subscriptions ss
    where ss.store_id=v_store
      and (
        (ss.status='pending' and coalesce(ss.pending_expires_at,now()+interval '1 second')>now())
        or (ss.status='active' and (ss.expires_at is null or ss.expires_at>now()))
        or ss.status='past_due'
      )
  ) then
    raise exception 'SUBSCRIPTION_ALREADY_EXISTS';
  end if;

  select *
    into v_price
  from public.velora_resolve_subscription_price(
    p_plan_id,
    v_country,
    v_cycle
  )
  limit 1;

  if v_price.price is null or v_price.price<=0 then
    raise exception 'INVALID_RESOLVED_SUBSCRIPTION_PRICE';
  end if;

  select id
    into v_method_id
  from public.payment_methods
  where code='card'
    and is_active=true
  limit 1;

  if v_method_id is null then raise exception 'CARD_METHOD_NOT_CONFIGURED'; end if;

  insert into public.seller_subscriptions(
    store_id,
    plan_id,
    status,
    billing_cycle,
    price,
    currency_code,
    payment_status,
    purchase_idempotency_key,
    subscription_series_id,
    pending_expires_at,
    created_at,
    updated_at
  )
  values(
    v_store,
    p_plan_id,
    'pending',
    v_cycle,
    v_price.price,
    v_price.currency_code,
    'pending'::public.payment_status,
    v_key,
    gen_random_uuid(),
    now()+interval '30 minutes',
    now(),
    now()
  )
  returning * into v_sub;

  select *
    into v_attempt
  from public.velora_create_payment_attempt(
    null::uuid,
    v_method_id,
    v_country,
    v_key,
    'subscription',
    v_sub.id
  )
  limit 1;

  select status
    into v_attempt_status
  from public.payment_attempts
  where id=v_attempt.attempt_id;

  return jsonb_build_object(
    'ok',true,
    'reused',false,
    'subscription_id',v_sub.id,
    'subscription_series_id',v_sub.subscription_series_id,
    'subscription_status',v_sub.status,
    'billing_cycle',v_sub.billing_cycle,
    'price',v_sub.price,
    'currency_code',v_sub.currency_code,
    'pending_expires_at',v_sub.pending_expires_at,
    'payment_attempt_id',v_attempt.attempt_id,
    'provider_id',v_attempt.provider_id,
    'provider_code',v_attempt.provider_code,
    'provider_name',v_attempt.provider_name,
    'environment',v_attempt.environment,
    'payment_attempt_status',v_attempt_status
  );
end;
$function$;
