-- Velora Paymob reconciliation worker contract
-- Restore-Test / staging. Production remains frozen.

create table if not exists private.paymob_reconciliation_state (
  payment_attempt_id uuid primary key references public.payment_attempts(id) on delete cascade,
  status text not null default 'in_progress'
    check (status in ('in_progress','waiting','completed','ambiguous','exhausted')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  lease_until timestamptz,
  next_attempt_at timestamptz not null default now(),
  last_outcome text,
  last_error text,
  last_http_status integer,
  last_provider_transaction_id text,
  last_inquired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_paymob_recon_due
  on private.paymob_reconciliation_state(status, next_attempt_at, lease_until);

revoke all on table private.paymob_reconciliation_state from public, anon, authenticated;

create or replace function public.velora_validate_paymob_reconciliation_secret(p_secret text)
returns boolean
language plpgsql
security definer
set search_path to 'public','vault','pg_catalog'
as $function$
declare v_expected text;
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  select ds.decrypted_secret into v_expected
  from vault.decrypted_secrets ds
  where ds.name='velora_paymob_reconciliation_secret'
  limit 1;
  return v_expected is not null
     and p_secret is not null
     and length(p_secret) > 0
     and p_secret = v_expected;
end;
$function$;

revoke all on function public.velora_validate_paymob_reconciliation_secret(text)
  from public, anon, authenticated;
grant execute on function public.velora_validate_paymob_reconciliation_secret(text)
  to service_role;

create or replace function private.velora_claim_paymob_reconciliation(
  p_limit integer default 5,
  p_stale_minutes integer default 70,
  p_lease_minutes integer default 10
)
returns table(
  payment_attempt_id uuid,
  order_id uuid,
  paymob_order_id text,
  local_status text,
  attempt_number integer
)
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 10 then raise exception 'INVALID_RECONCILIATION_LIMIT'; end if;
  if p_stale_minutes is null or p_stale_minutes < 1 or p_stale_minutes > 240 then raise exception 'INVALID_RECONCILIATION_WINDOW'; end if;
  if p_lease_minutes is null or p_lease_minutes < 1 or p_lease_minutes > 30 then raise exception 'INVALID_RECONCILIATION_LEASE'; end if;

  return query
  with candidates as (
    select
      pa.id,
      pa.order_id,
      nullif(trim(pa.metadata->>'paymob_order_id'),'') as paymob_order_id,
      pa.status::text as local_status,
      rs.attempt_count as recon_attempt_count
    from public.payment_attempts pa
    join public.payment_providers pp on pp.id=pa.provider_id
    join public.orders o on o.id=pa.order_id
    left join private.paymob_reconciliation_state rs on rs.payment_attempt_id=pa.id
    where pa.purpose='marketplace_order'
      and pp.code='paymob'
      and pp.is_active=true
      and pa.status in ('pending','requires_action','authorized')
      and pa.metadata->>'paymob_reconciliation_eligible'='true'
      and nullif(trim(pa.metadata->>'paymob_order_id'),'') is not null
      and o.payment_status='pending'
      and pa.created_at <= now() - make_interval(mins => p_stale_minutes)
      and (
        rs.payment_attempt_id is null
        or (rs.status in ('waiting','ambiguous') and rs.attempt_count < 3 and rs.next_attempt_at <= now())
        or (rs.status='in_progress' and rs.attempt_count < 3 and coalesce(rs.lease_until,'epoch'::timestamptz) <= now())
      )
      and not exists (
        select 1
        from public.provider_webhook_events pwe
        where pwe.provider_code='paymob'
          and pwe.status='processed'
          and pwe.payload->'obj'->'order'->>'id'=nullif(trim(pa.metadata->>'paymob_order_id'),'')
      )
    order by pa.created_at,pa.id
    limit p_limit
  ),
  claimed as (
    insert into private.paymob_reconciliation_state(
      payment_attempt_id,status,attempt_count,lease_until,next_attempt_at,updated_at
    )
    select
      c.id,'in_progress',coalesce(c.recon_attempt_count,0)+1,
      now()+make_interval(mins=>p_lease_minutes),now(),now()
    from candidates c
    on conflict on constraint paymob_reconciliation_state_pkey
    do update
      set status='in_progress',
          attempt_count=private.paymob_reconciliation_state.attempt_count+1,
          lease_until=excluded.lease_until,
          next_attempt_at=now(),
          updated_at=now()
    returning private.paymob_reconciliation_state.payment_attempt_id,
              private.paymob_reconciliation_state.attempt_count
  )
  select c.id,c.order_id,c.paymob_order_id,c.local_status,cl.attempt_count
  from candidates c
  join claimed cl on cl.payment_attempt_id=c.id;
end;
$function$;

revoke all on function private.velora_claim_paymob_reconciliation(integer,integer,integer)
  from public, anon, authenticated;
grant execute on function private.velora_claim_paymob_reconciliation(integer,integer,integer)
  to service_role;

create or replace function public.velora_claim_paymob_reconciliation(
  p_limit integer default 5,
  p_stale_minutes integer default 70,
  p_lease_minutes integer default 10
)
returns table(
  payment_attempt_id uuid,
  order_id uuid,
  paymob_order_id text,
  local_status text,
  attempt_number integer
)
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  return query
    select x.payment_attempt_id,x.order_id,x.paymob_order_id,x.local_status,x.attempt_number
    from private.velora_claim_paymob_reconciliation(p_limit,p_stale_minutes,p_lease_minutes) x;
end;
$function$;

revoke all on function public.velora_claim_paymob_reconciliation(integer,integer,integer)
  from public, anon, authenticated;
grant execute on function public.velora_claim_paymob_reconciliation(integer,integer,integer)
  to service_role;

create or replace function private.velora_record_paymob_reconciliation_result(
  p_payment_attempt_id uuid,
  p_outcome text,
  p_provider_transaction_id text default null,
  p_http_status integer default null,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
declare
  v_state private.paymob_reconciliation_state%rowtype;
  v_next_status text;
  v_next_attempt_at timestamptz;
  v_exhausted boolean := false;
  v_delay_minutes integer;
  v_event_id uuid;
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
  if p_payment_attempt_id is null then raise exception 'PAYMENT_ATTEMPT_REQUIRED'; end if;
  if p_outcome is null or p_outcome not in (
    'pending','requires_action','authorized','captured','failed','refunded','cancelled','ambiguous','error'
  ) then
    raise exception 'INVALID_RECONCILIATION_OUTCOME';
  end if;

  select * into v_state
  from private.paymob_reconciliation_state
  where payment_attempt_id=p_payment_attempt_id
  for update;

  if not found then raise exception 'RECONCILIATION_STATE_NOT_FOUND'; end if;

  if v_state.status='completed' then
    return jsonb_build_object('ok',true,'idempotent',true,'payment_attempt_id',p_payment_attempt_id,'status','completed');
  end if;

  if p_outcome in ('captured','failed','refunded','cancelled') then
    v_next_status:='completed';
    v_next_attempt_at:=now();
  elsif v_state.attempt_count >= 3 then
    v_next_status:='exhausted';
    v_exhausted:=true;
    v_next_attempt_at:=now();
  else
    v_next_status:=case when p_outcome in ('ambiguous','error') then 'ambiguous' else 'waiting' end;
    v_delay_minutes:=case when v_state.attempt_count <= 1 then 15 when v_state.attempt_count=2 then 30 else 60 end;
    v_next_attempt_at:=now()+make_interval(mins=>v_delay_minutes);
  end if;

  update private.paymob_reconciliation_state
  set status=v_next_status,
      lease_until=null,
      next_attempt_at=v_next_attempt_at,
      last_outcome=p_outcome,
      last_error=nullif(trim(coalesce(p_error,'')),''),
      last_http_status=p_http_status,
      last_provider_transaction_id=nullif(trim(coalesce(p_provider_transaction_id,'')),''),
      last_inquired_at=now(),
      updated_at=now()
  where payment_attempt_id=p_payment_attempt_id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    null,'paymob_reconciliation_inquiry_result','payment_attempt',p_payment_attempt_id,
    jsonb_build_object(
      'outcome',p_outcome,
      'provider_transaction_id',nullif(trim(coalesce(p_provider_transaction_id,'')),''),
      'http_status',p_http_status,
      'attempt_count',v_state.attempt_count,
      'next_status',v_next_status,
      'source','paymob_transaction_inquiry',
      'error',nullif(trim(coalesce(p_error,'')),'')
    )
  );

  if v_exhausted then
    insert into public.automation_events(event_type,source_type,source_id,severity,payload)
    values(
      'reconciliation_finding','payment_attempt',p_payment_attempt_id,'high',
      jsonb_build_object(
        'check_code','PAYMOB_INQUIRY_EXHAUSTED',
        'message','Paymob reconciliation could not reach a definitive terminal state after bounded retries.',
        'details',jsonb_build_object(
          'payment_attempt_id',p_payment_attempt_id,
          'last_outcome',p_outcome,
          'last_error',nullif(trim(coalesce(p_error,'')),''),
          'last_provider_transaction_id',nullif(trim(coalesce(p_provider_transaction_id,'')),''),
          'attempt_count',v_state.attempt_count,
          'source','paymob_transaction_inquiry'
        )
      )
    )
    returning id into v_event_id;
    perform public.velora_reconcile_automation_event(v_event_id);
  end if;

  return jsonb_build_object(
    'ok',true,'idempotent',false,'payment_attempt_id',p_payment_attempt_id,
    'status',v_next_status,'attempt_count',v_state.attempt_count,
    'next_attempt_at',v_next_attempt_at,'exhausted',v_exhausted
  );
end;
$function$;

revoke all on function private.velora_record_paymob_reconciliation_result(uuid,text,text,integer,text)
  from public, anon, authenticated;
grant execute on function private.velora_record_paymob_reconciliation_result(uuid,text,text,integer,text)
  to service_role;

create or replace function public.velora_record_paymob_reconciliation_result(
  p_payment_attempt_id uuid,
  p_outcome text,
  p_provider_transaction_id text default null,
  p_http_status integer default null,
  p_error text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
  return private.velora_record_paymob_reconciliation_result(
    p_payment_attempt_id,p_outcome,p_provider_transaction_id,p_http_status,p_error
  );
end;
$function$;

revoke all on function public.velora_record_paymob_reconciliation_result(uuid,text,text,integer,text)
  from public, anon, authenticated;
grant execute on function public.velora_record_paymob_reconciliation_result(uuid,text,text,integer,text)
  to service_role;

create or replace function public.velora_create_payment_attempt(
  p_order_id uuid,
  p_method_id uuid,
  p_country_code text,
  p_idempotency_key text,
  p_purpose text,
  p_seller_subscription_id uuid
)
returns table(
  attempt_id uuid,
  provider_id uuid,
  provider_code text,
  provider_name text,
  environment text,
  amount numeric,
  currency_code text
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid:=auth.uid();
  v_purpose text:=lower(trim(coalesce(p_purpose,'')));
  v_amount numeric;
  v_currency text;
  v_attempt uuid;
  v_provider uuid;
  v_method uuid;
  v_order_status text;
  v_payment_status text;
  v_existing_amount numeric;
  v_existing_currency text;
  v_existing_order uuid;
  v_existing_purpose text;
  v_existing_subscription uuid;
  v_subscription_status text;
  v_subscription_expires timestamptz;
  v_store_owner uuid;
  v_provider_code text;
begin
  if v_user is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if v_purpose not in ('marketplace_order','subscription') then raise exception 'INVALID_PAYMENT_PURPOSE'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key))<8 or length(trim(p_idempotency_key))>200 then raise exception 'INVALID_IDEMPOTENCY_KEY'; end if;
  if p_country_code is null or length(trim(p_country_code))<>2 then raise exception 'INVALID_COUNTRY_CODE'; end if;

  if v_purpose='marketplace_order' then
    if p_order_id is null then raise exception 'ORDER_REQUIRED_FOR_MARKETPLACE_PAYMENT'; end if;
    if p_seller_subscription_id is not null then raise exception 'SUBSCRIPTION_REFERENCE_FORBIDDEN_FOR_MARKETPLACE_PAYMENT'; end if;
    select o.total,o.currency,o.status::text,o.payment_status::text into v_amount,v_currency,v_order_status,v_payment_status
    from public.orders o where o.id=p_order_id and o.customer_id=v_user for update;
    if v_amount is null then raise exception 'ORDER_NOT_FOUND'; end if;
    if v_order_status in ('cancelled','refunded') or v_payment_status in ('paid','cancelled','refunded') then raise exception 'ORDER_NOT_PAYABLE'; end if;
    if v_amount<=0 then raise exception 'INVALID_PAYMENT_AMOUNT'; end if;
  else
    if p_order_id is not null then raise exception 'ORDER_FORBIDDEN_FOR_SUBSCRIPTION_PAYMENT'; end if;
    if p_seller_subscription_id is null then raise exception 'SUBSCRIPTION_REQUIRED_FOR_SUBSCRIPTION_PAYMENT'; end if;
    select ss.price,ss.currency_code,ss.status,ss.pending_expires_at,st.owner_id
      into v_amount,v_currency,v_subscription_status,v_subscription_expires,v_store_owner
    from public.seller_subscriptions ss join public.stores st on st.id=ss.store_id
    where ss.id=p_seller_subscription_id and st.owner_id=v_user for update of ss;
    if v_amount is null then raise exception 'SUBSCRIPTION_NOT_FOUND'; end if;
    if v_subscription_status in ('cancelled','expired') then raise exception 'SUBSCRIPTION_NOT_PAYABLE'; end if;
    if v_subscription_status='pending' and v_subscription_expires is not null and v_subscription_expires<=now() then raise exception 'SUBSCRIPTION_PAYMENT_WINDOW_EXPIRED'; end if;
    if v_amount<=0 then raise exception 'INVALID_PAYMENT_AMOUNT'; end if;
  end if;

  select pa.id,pa.amount,pa.currency_code,pa.order_id,pa.purpose,pa.seller_subscription_id
    into v_attempt,v_existing_amount,v_existing_currency,v_existing_order,v_existing_purpose,v_existing_subscription
  from public.payment_attempts pa where pa.idempotency_key=trim(p_idempotency_key) order by pa.created_at desc limit 1;

  if v_attempt is not null then
    if v_existing_amount is distinct from v_amount
       or upper(v_existing_currency) is distinct from upper(v_currency)
       or v_existing_order is distinct from p_order_id
       or v_existing_purpose is distinct from v_purpose
       or v_existing_subscription is distinct from p_seller_subscription_id then
      raise exception 'IDEMPOTENCY_MISMATCH';
    end if;
    return query
      select pa.id,pp.id,pp.code,pp.name,pp.environment,pa.amount,pa.currency_code
      from public.payment_attempts pa join public.payment_providers pp on pp.id=pa.provider_id
      where pa.id=v_attempt;
    return;
  end if;

  select r.provider_id,r.method_id
    into v_provider,v_method
  from public.velora_get_payment_route(upper(trim(p_country_code)),v_currency,p_method_id,v_amount) r limit 1;
  if v_provider is null then raise exception 'NO_PAYMENT_ROUTE'; end if;

  select pp.code into v_provider_code from public.payment_providers pp where pp.id=v_provider;

  insert into public.payment_attempts(
    order_id,user_id,provider_id,method_id,amount,currency_code,purpose,
    seller_subscription_id,status,idempotency_key,payment_reference,metadata
  )
  values(
    p_order_id,v_user,v_provider,coalesce(v_method,p_method_id),v_amount,v_currency,v_purpose,
    p_seller_subscription_id,'pending',trim(p_idempotency_key),gen_random_uuid()::text,
    case when v_purpose='marketplace_order' and lower(coalesce(v_provider_code,''))='paymob'
      then jsonb_build_object('paymob_reconciliation_eligible',true)
      else '{}'::jsonb
    end
  )
  on conflict (idempotency_key) where idempotency_key is not null
  do nothing
  returning id into v_attempt;

  if v_attempt is null then
    select pa.id,pa.amount,pa.currency_code,pa.order_id,pa.purpose,pa.seller_subscription_id
      into v_attempt,v_existing_amount,v_existing_currency,v_existing_order,v_existing_purpose,v_existing_subscription
    from public.payment_attempts pa where pa.idempotency_key=trim(p_idempotency_key)
    order by pa.created_at desc limit 1;
    if v_attempt is null then raise exception 'PAYMENT_ATTEMPT_CREATE_FAILED'; end if;
    if v_existing_amount is distinct from v_amount
       or upper(v_existing_currency) is distinct from upper(v_currency)
       or v_existing_order is distinct from p_order_id
       or v_existing_purpose is distinct from v_purpose
       or v_existing_subscription is distinct from p_seller_subscription_id then
      raise exception 'IDEMPOTENCY_MISMATCH';
    end if;
  end if;

  return query
    select v_attempt,pp.id,pp.code,pp.name,pp.environment,v_amount,v_currency
    from public.payment_providers pp where pp.id=v_provider;
end;
$function$;
