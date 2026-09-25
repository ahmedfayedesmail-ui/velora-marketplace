CREATE OR REPLACE FUNCTION public.velora_process_paymob_transaction_internal(p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_obj jsonb := coalesce(p_payload->'obj','{}'::jsonb);
  v_paymob_order_id text;
  v_order_id uuid;
  v_tx_id text;
  v_success boolean;
  v_refunded boolean;
  v_pending boolean;
  v_is_auth boolean;
  v_is_capture boolean;
  v_is_captured boolean;
  v_is_voided boolean;
  v_event_id text;
  v_attempt_id uuid;
  v_new_payment_status text;
  v_ambiguous_success boolean := false;
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  v_tx_id := nullif(v_obj->>'id','');
  v_paymob_order_id := nullif(v_obj->'order'->>'id','');
  if v_paymob_order_id is null then
    raise exception 'paymob_order_id_missing';
  end if;
  v_success := coalesce((v_obj->>'success')::boolean,false);
  v_refunded := coalesce((v_obj->>'is_refunded')::boolean,false);
  v_pending := coalesce((v_obj->>'pending')::boolean,false);
  v_is_auth := (v_obj->>'is_auth')::boolean;
  v_is_capture := (v_obj->>'is_capture')::boolean;
  v_is_captured := (v_obj->>'is_captured')::boolean;
  v_is_voided := coalesce((v_obj->>'is_voided')::boolean,false);
  v_event_id := 'paymob_tx_' || coalesce(v_tx_id,'unknown');

  if v_refunded then
    v_new_payment_status := 'refunded';
  elsif v_is_voided then
    v_new_payment_status := 'failed';
  elsif v_pending then
    v_new_payment_status := 'pending';
  elsif v_success and v_is_captured is true then
    v_new_payment_status := 'captured';
  elsif v_success and v_is_auth is true
        and (v_is_capture is false or v_is_capture is null) then
    v_new_payment_status := 'authorized';
  elsif not v_success then
    v_new_payment_status := 'failed';
  else
    v_ambiguous_success := true;
    v_new_payment_status := 'pending';
  end if;

  select pa.id, pa.order_id
    into v_attempt_id, v_order_id
  from public.payment_attempts pa
  join public.payment_providers pp on pp.id=pa.provider_id
  where pp.code='paymob'
    and pa.purpose='marketplace_order'
    and pa.metadata->>'paymob_order_id'=v_paymob_order_id
  order by pa.created_at desc
  limit 1;

  if v_attempt_id is null or v_order_id is null then
    raise exception 'payment_attempt_correlation_missing';
  end if;

  update public.payment_attempts
  set provider_payment_id=coalesce(v_tx_id,provider_payment_id),
      status=v_new_payment_status,
      error_code=case when v_success then null else coalesce(v_obj->>'txn_response_code',v_obj->>'acq_response_code',error_code) end,
      error_message=case when v_success then null else coalesce(v_obj->'data'->>'message',error_message) end,
      metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
        'paymob_transaction_id',v_tx_id,
        'paymob_order_id',v_obj->'order'->>'id',
        'paymob_intention_id',v_obj->'payment_key_claims'->>'order_id',
        'reconciled_at',now()
      ),
      updated_at=now(),
      authorized_at=case
        when v_new_payment_status='authorized'
        then coalesce(authorized_at,now())
        else authorized_at
      end,
      captured_at=case
        when v_new_payment_status='captured'
        then coalesce(captured_at,now())
        else captured_at
      end,
      completed_at=case
        when v_new_payment_status in ('captured','refunded')
        then coalesce(completed_at,now())
        else completed_at
      end
  where id=v_attempt_id;

  update public.orders
  set payment_status = case
        when v_new_payment_status='captured' then 'paid'::payment_status
        when v_new_payment_status='authorized' then 'pending'::payment_status
        else v_new_payment_status::payment_status
      end,
      status = case
        when v_new_payment_status='captured' and status='pending' then 'confirmed'::order_status
        else status
      end,
      updated_at=now()
  where id=v_order_id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    null,
    'paymob_transaction_reconciled',
    'order',
    v_order_id,
    jsonb_build_object(
      'transaction_id',v_tx_id,
      'success',v_success,
      'refunded',v_refunded,
      'payment_attempt_id',v_attempt_id,
      'payment_status',v_new_payment_status
    )
  );

  if v_ambiguous_success then
    insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
    values(
      null,
      'paymob_ambiguous_success_state',
      'order',
      v_order_id,
      jsonb_build_object(
        'transaction_id',v_tx_id,
        'payment_attempt_id',v_attempt_id,
        'success',v_success,
        'pending',v_pending,
        'is_auth',v_is_auth,
        'is_capture',v_is_capture,
        'is_captured',v_is_captured,
        'is_refunded',v_refunded,
        'is_voided',v_is_voided,
        'decision','pending'
      )
    );
  end if;

  return jsonb_build_object('ok',true,'order_id',v_order_id,'payment_attempt_id',v_attempt_id,'payment_status',v_new_payment_status,'event_id',v_event_id);
end;
$function$

