-- Velora Restore-Test only.
-- Reuse the existing Paymob reconciliation worker and the existing
-- failed-payment inventory/order recovery trigger.
-- A Paymob Intention created by the current canonical checkout uses
-- expiration=3600 seconds (1 hour). After 3 bounded inquiries have all
-- remained pending and the local attempt is older than 60 minutes, the
-- payment intention is treated as expired and the local attempt is failed.
-- Only marketplace_order Paymob attempts explicitly marked reconciliation-
-- eligible are covered. Ambiguous/error outcomes remain human-review findings.

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
set search_path to 'public', 'private', 'pg_catalog'
as $function$
declare
  v_state private.paymob_reconciliation_state%rowtype;
  v_attempt public.payment_attempts%rowtype;
  v_provider_code text;
  v_next_status text;
  v_next_attempt_at timestamptz;
  v_exhausted boolean := false;
  v_expired boolean := false;
  v_delay_minutes integer;
  v_event_id uuid;
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  if p_payment_attempt_id is null then
    raise exception 'PAYMENT_ATTEMPT_REQUIRED';
  end if;
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

  select pa.*, pp.code
    into v_attempt, v_provider_code
  from public.payment_attempts pa
  left join public.payment_providers pp on pp.id=pa.provider_id
  where pa.id=p_payment_attempt_id
  for update;

  if not found then raise exception 'PAYMENT_ATTEMPT_NOT_FOUND'; end if;

  if v_state.status='completed' then
    return jsonb_build_object(
      'ok',true,
      'idempotent',true,
      'payment_attempt_id',p_payment_attempt_id,
      'status','completed'
    );
  end if;

  -- If a webhook already moved the attempt to a terminal state while this
  -- reconciliation lease was active, never override that canonical state.
  if v_attempt.status in ('captured','failed','refunded','cancelled') then
    update private.paymob_reconciliation_state
    set status='completed',
        lease_until=null,
        next_attempt_at=now(),
        last_outcome=coalesce(p_outcome,v_attempt.status),
        last_error=null,
        last_http_status=p_http_status,
        last_provider_transaction_id=coalesce(
          nullif(trim(coalesce(p_provider_transaction_id,'')), ''),
          v_attempt.provider_payment_id
        ),
        last_inquired_at=now(),
        updated_at=now()
    where payment_attempt_id=p_payment_attempt_id;

    return jsonb_build_object(
      'ok',true,
      'idempotent',true,
      'payment_attempt_id',p_payment_attempt_id,
      'status','completed',
      'canonical_payment_attempt_status',v_attempt.status
    );
  end if;

  if p_outcome in ('captured','failed','refunded','cancelled') then
    v_next_status := 'completed';
    v_next_attempt_at := now();
  else
    if v_state.attempt_count >= 3
       and p_outcome='pending'
       and v_provider_code='paymob'
       and v_attempt.purpose='marketplace_order'
       and v_attempt.metadata->>'paymob_reconciliation_eligible'='true'
       and v_attempt.status in ('pending','requires_action')
       and v_attempt.created_at <= now() - interval '60 minutes'
    then
      -- Current canonical Paymob checkout sets Intention expiration to 3600
      -- seconds. Reuse the existing failed-payment trigger for all recovery
      -- side effects instead of creating a second failure/release engine.
      update public.payment_attempts
      set status='failed',
          failure_code='PAYMOB_INTENTION_EXPIRED',
          failure_reason='Paymob payment intention expired after bounded reconciliation remained pending.',
          error_code='PAYMOB_INTENTION_EXPIRED',
          error_message='Paymob payment intention expired after bounded reconciliation remained pending.',
          completed_at=coalesce(completed_at,now()),
          updated_at=now()
      where id=v_attempt.id
        and status in ('pending','requires_action');

      if not found then
        raise exception 'PAYMOB_EXPIRY_STATE_RACE';
      end if;

      v_expired := true;
      v_next_status := 'completed';
      v_next_attempt_at := now();
    elsif v_state.attempt_count >= 3 then
      v_next_status := 'exhausted';
      v_exhausted := true;
      v_next_attempt_at := now();
    else
      v_next_status := case when p_outcome in ('ambiguous','error') then 'ambiguous' else 'waiting' end;
      v_delay_minutes := case
        when v_state.attempt_count <= 1 then 15
        when v_state.attempt_count = 2 then 30
        else 60
      end;
      v_next_attempt_at := now() + make_interval(mins => v_delay_minutes);
    end if;
  end if;

  update private.paymob_reconciliation_state
  set status=v_next_status,
      lease_until=null,
      next_attempt_at=v_next_attempt_at,
      last_outcome=case when v_expired then 'failed' else p_outcome end,
      last_error=case
        when v_expired then 'PAYMOB_INTENTION_EXPIRED'
        else nullif(trim(coalesce(p_error,'')),'')
      end,
      last_http_status=p_http_status,
      last_provider_transaction_id=nullif(trim(coalesce(p_provider_transaction_id,'')),''),
      last_inquired_at=now(),
      updated_at=now()
  where payment_attempt_id=p_payment_attempt_id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    null,
    case when v_expired then 'paymob_reconciliation_intention_expired'
         else 'paymob_reconciliation_inquiry_result' end,
    'payment_attempt',
    p_payment_attempt_id,
    jsonb_build_object(
      'outcome',case when v_expired then 'failed' else p_outcome end,
      'provider_transaction_id',nullif(trim(coalesce(p_provider_transaction_id,'')),''),
      'http_status',p_http_status,
      'attempt_count',v_state.attempt_count,
      'next_status',v_next_status,
      'source','paymob_transaction_inquiry',
      'expired',v_expired,
      'error',case
        when v_expired then 'PAYMOB_INTENTION_EXPIRED'
        else nullif(trim(coalesce(p_error,'')),'')
      end
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
    'ok',true,
    'idempotent',false,
    'payment_attempt_id',p_payment_attempt_id,
    'status',v_next_status,
    'attempt_count',v_state.attempt_count,
    'next_attempt_at',v_next_attempt_at,
    'exhausted',v_exhausted,
    'expired',v_expired,
    'payment_attempt_status',case when v_expired then 'failed' else v_attempt.status end
  );
end;
$function$;
