-- Bind the Paymob provider Order ID to the authenticated payment attempt.
-- The provider Order ID is returned as order.id in the signed transaction callback.
-- This gives the webhook a signed correlation key instead of trusting unsigned callback extras.

create or replace function public.velora_attach_payment_provider_session(
  p_payment_attempt_id uuid,
  p_provider_code text,
  p_provider_session_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select pa.order_id into v_order_id
  from public.payment_attempts pa
  join public.orders o on o.id = pa.order_id
  where pa.id = p_payment_attempt_id
    and pa.user_id = v_uid
  for update;

  if v_order_id is null then raise exception 'PAYMENT_ATTEMPT_NOT_FOUND'; end if;
  if nullif(trim(p_provider_code),'') is null
     or nullif(trim(p_provider_session_id),'') is null then
    raise exception 'INVALID_PROVIDER_SESSION';
  end if;

  update public.payment_attempts
  set provider_session_id = trim(p_provider_session_id),
      provider_payment_id = coalesce(provider_payment_id, trim(p_provider_session_id)),
      updated_at = now()
  where id = p_payment_attempt_id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,'payment_provider_session_attached','payment_attempt',p_payment_attempt_id,
         jsonb_build_object('provider',lower(trim(p_provider_code)),'order_id',v_order_id));

  return jsonb_build_object('ok',true,'payment_attempt_id',p_payment_attempt_id,
                            'provider',lower(trim(p_provider_code)),'order_id',v_order_id);
end;
$$;

create or replace function public.velora_attach_payment_provider_session(
  p_payment_attempt_id uuid,
  p_provider_code text,
  p_provider_session_id text,
  p_provider_order_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select pa.order_id into v_order_id
  from public.payment_attempts pa
  join public.orders o on o.id = pa.order_id
  where pa.id = p_payment_attempt_id
    and pa.user_id = v_uid
  for update;

  if v_order_id is null then raise exception 'PAYMENT_ATTEMPT_NOT_FOUND'; end if;
  if nullif(trim(p_provider_code),'') is null
     or nullif(trim(p_provider_session_id),'') is null then
    raise exception 'INVALID_PROVIDER_SESSION';
  end if;

  if lower(trim(p_provider_code)) = 'paymob'
     and nullif(trim(p_provider_order_id),'') is null then
    raise exception 'PAYMOB_PROVIDER_ORDER_ID_REQUIRED';
  end if;

  update public.payment_attempts
  set provider_session_id = trim(p_provider_session_id),
      provider_payment_id = coalesce(provider_payment_id, trim(p_provider_session_id)),
      metadata = jsonb_set(
        coalesce(metadata,'{}'::jsonb),
        '{paymob_order_id}',
        to_jsonb(nullif(trim(p_provider_order_id),''))
      ),
      updated_at = now()
  where id = p_payment_attempt_id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,'payment_provider_session_attached','payment_attempt',p_payment_attempt_id,
         jsonb_build_object('provider',lower(trim(p_provider_code)),
                            'order_id',v_order_id,
                            'provider_order_bound',nullif(trim(p_provider_order_id),'')));

  return jsonb_build_object('ok',true,'payment_attempt_id',p_payment_attempt_id,
                            'provider',lower(trim(p_provider_code)),
                            'order_id',v_order_id,
                            'provider_order_bound',nullif(trim(p_provider_order_id),''));
end;
$$;

revoke all on function public.velora_attach_payment_provider_session(uuid,text,text) from public, anon;
grant execute on function public.velora_attach_payment_provider_session(uuid,text,text) to authenticated;

revoke all on function public.velora_attach_payment_provider_session(uuid,text,text,text) from public, anon;
grant execute on function public.velora_attach_payment_provider_session(uuid,text,text,text) to authenticated;
