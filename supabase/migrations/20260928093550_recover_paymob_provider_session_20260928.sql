create or replace function public.velora_recover_paymob_provider_session(
  p_payment_attempt_id uuid,
  p_provider_session_id text,
  p_provider_order_id text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_attempt public.payment_attempts%rowtype;
  v_existing_order_id text;
begin
  if p_payment_attempt_id is null
     or nullif(trim(p_provider_session_id),'') is null
     or nullif(trim(p_provider_order_id),'') is null then
    raise exception 'PAYMOB_RECOVERY_FIELDS_REQUIRED';
  end if;

  select pa.*
    into v_attempt
  from public.payment_attempts pa
  join public.payment_providers pp on pp.id = pa.provider_id
  where pa.id = p_payment_attempt_id
    and lower(trim(pp.code)) = 'paymob'
    and pa.purpose in ('marketplace_order','subscription','seller_ad')
  for update;

  if not found then
    raise exception 'PAYMOB_RECOVERY_ATTEMPT_NOT_FOUND';
  end if;

  if v_attempt.status in ('captured','refunded','cancelled') then
    raise exception 'PAYMOB_RECOVERY_ATTEMPT_TERMINAL';
  end if;

  v_existing_order_id := nullif(trim(coalesce(v_attempt.metadata->>'paymob_order_id','')),'');
  if v_existing_order_id is not null
     and v_existing_order_id <> trim(p_provider_order_id) then
    raise exception 'PAYMOB_RECOVERY_PROVIDER_ORDER_CONFLICT';
  end if;

  if v_attempt.provider_session_id is not null
     and trim(v_attempt.provider_session_id) <> trim(p_provider_session_id) then
    raise exception 'PAYMOB_RECOVERY_PROVIDER_SESSION_CONFLICT';
  end if;

  update public.payment_attempts
  set provider_session_id = trim(p_provider_session_id),
      provider_payment_id = coalesce(provider_payment_id, trim(p_provider_session_id)),
      metadata = jsonb_set(
        coalesce(metadata,'{}'::jsonb),
        '{paymob_order_id}',
        to_jsonb(trim(p_provider_order_id))
      ),
      updated_at = now()
  where id = v_attempt.id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    null,
    'paymob_provider_session_recovered',
    'payment_attempt',
    v_attempt.id,
    jsonb_build_object(
      'purpose',v_attempt.purpose,
      'provider','paymob',
      'provider_order_bound',trim(p_provider_order_id),
      'recovery_source','server_authoritative'
    )
  );

  return jsonb_build_object(
    'ok',true,
    'payment_attempt_id',v_attempt.id,
    'purpose',v_attempt.purpose,
    'provider_session_id',v_attempt.provider_session_id,
    'provider_order_id',v_attempt.metadata->>'paymob_order_id'
  );
end;
$function$;

revoke all on function public.velora_recover_paymob_provider_session(uuid,text,text) from public;
revoke all on function public.velora_recover_paymob_provider_session(uuid,text,text) from authenticated;
revoke all on function public.velora_recover_paymob_provider_session(uuid,text,text) from anon;
grant execute on function public.velora_recover_paymob_provider_session(uuid,text,text) to service_role;
