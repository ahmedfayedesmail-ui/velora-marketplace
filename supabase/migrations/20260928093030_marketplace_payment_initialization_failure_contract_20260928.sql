create or replace function public.velora_mark_marketplace_payment_initialization_failed(
  p_payment_attempt_id uuid,
  p_failure_code text,
  p_failure_reason text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_uid uuid := auth.uid();
  v_attempt public.payment_attempts%rowtype;
  v_updated public.payment_attempts%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_payment_attempt_id is null then
    raise exception 'PAYMENT_ATTEMPT_REQUIRED';
  end if;

  select pa.*
    into v_attempt
  from public.payment_attempts pa
  where pa.id = p_payment_attempt_id
    and pa.user_id = v_uid
    and pa.purpose = 'marketplace_order'
  for update;

  if not found then
    raise exception 'MARKETPLACE_PAYMENT_ATTEMPT_NOT_FOUND';
  end if;

  if v_attempt.status in ('captured','refunded','cancelled','failed') then
    return jsonb_build_object(
      'ok', true,
      'already_terminal', true,
      'payment_attempt_id', v_attempt.id,
      'payment_attempt_status', v_attempt.status
    );
  end if;

  if v_attempt.status not in ('pending','requires_action') then
    raise exception 'MARKETPLACE_PAYMENT_ATTEMPT_NOT_INITIALIZABLE';
  end if;

  update public.payment_attempts
  set status='failed',
      failure_code=nullif(left(trim(coalesce(p_failure_code,'')),200),''),
      failure_reason=nullif(left(trim(coalesce(p_failure_reason,'')),500),''),
      error_code=nullif(left(trim(coalesce(p_failure_code,'')),200),''),
      error_message=nullif(left(trim(coalesce(p_failure_reason,'')),1000),''),
      completed_at=coalesce(completed_at,now()),
      updated_at=now()
  where id=v_attempt.id
  returning * into v_updated;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,
    'marketplace_payment_initialization_failed',
    'payment_attempt',
    v_attempt.id,
    jsonb_build_object(
      'order_id',v_attempt.order_id,
      'failure_code',p_failure_code
    )
  );

  return jsonb_build_object(
    'ok', true,
    'payment_attempt_id', v_updated.id,
    'payment_attempt_status', v_updated.status,
    'failure_code', v_updated.failure_code
  );
end;
$function$;

revoke all on function public.velora_mark_marketplace_payment_initialization_failed(uuid,text,text) from public;
grant execute on function public.velora_mark_marketplace_payment_initialization_failed(uuid,text,text) to authenticated;
grant execute on function public.velora_mark_marketplace_payment_initialization_failed(uuid,text,text) to service_role;
