-- VELORA — Subscription payment initialization failure hardening
-- Distinguish failures before provider transaction creation from ambiguous
-- provider-side failures after an intention may already exist.

create or replace function public.velora_mark_subscription_payment_initialization_failed(
  p_payment_attempt_id uuid,
  p_failure_code text,
  p_failure_reason text,
  p_cancel_pending_subscription boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
  v_attempt public.payment_attempts%rowtype;
  v_sub public.seller_subscriptions%rowtype;
  v_subscription_status text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
    into v_attempt
  from public.payment_attempts
  where id = p_payment_attempt_id
    and purpose = 'subscription'
    and user_id = v_uid
  for update;

  if not found then
    raise exception 'SUBSCRIPTION_PAYMENT_ATTEMPT_NOT_FOUND';
  end if;

  if v_attempt.seller_subscription_id is null then
    raise exception 'SUBSCRIPTION_PAYMENT_BINDING_MISSING';
  end if;

  select *
    into v_sub
  from public.seller_subscriptions
  where id = v_attempt.seller_subscription_id
  for update;

  if not found then
    raise exception 'SUBSCRIPTION_NOT_FOUND';
  end if;

  if v_attempt.status in ('captured','refunded','cancelled') then
    select status into v_subscription_status
    from public.seller_subscriptions
    where id=v_sub.id;
    return jsonb_build_object(
      'ok', true,
      'already_terminal', true,
      'payment_attempt_id', v_attempt.id,
      'payment_attempt_status', v_attempt.status,
      'subscription_id', v_sub.id,
      'subscription_status', v_subscription_status
    );
  end if;

  if v_attempt.status not in ('pending','authorized','requires_action') then
    raise exception 'SUBSCRIPTION_PAYMENT_ATTEMPT_NOT_INITIALIZABLE';
  end if;

  update public.payment_attempts
  set status='failed',
      failure_code=nullif(trim(coalesce(p_failure_code,'')),''),
      failure_reason=nullif(trim(coalesce(p_failure_reason,'')),''),
      error_code=nullif(trim(coalesce(p_failure_code,'')),''),
      error_message=nullif(trim(coalesce(p_failure_reason,'')),''),
      completed_at=now(),
      updated_at=now()
  where id=v_attempt.id;

  if p_cancel_pending_subscription
     and v_sub.status='pending'
     and v_attempt.provider_session_id is null
     and v_attempt.provider_payment_id is null then
    update public.seller_subscriptions
    set pending_expires_at=now(),
        updated_at=now()
    where id=v_sub.id
      and status='pending';
  end if;

  perform public.velora_sync_subscription_state(v_sub.id);

  select status into v_subscription_status
  from public.seller_subscriptions
  where id=v_sub.id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,
    'subscription_payment_initialization_failed',
    'seller_subscription',
    v_sub.id,
    jsonb_build_object(
      'payment_attempt_id',v_attempt.id,
      'failure_code',p_failure_code,
      'cancel_pending_subscription',p_cancel_pending_subscription,
      'subscription_status',v_subscription_status
    )
  );

  return jsonb_build_object(
    'ok', true,
    'payment_attempt_id', v_attempt.id,
    'payment_attempt_status', 'failed',
    'subscription_id', v_sub.id,
    'subscription_status', v_subscription_status
  );
end;
$function$;

revoke all on function public.velora_mark_subscription_payment_initialization_failed(uuid,text,text,boolean)
from public;
revoke all on function public.velora_mark_subscription_payment_initialization_failed(uuid,text,text,boolean)
from anon;
grant execute on function public.velora_mark_subscription_payment_initialization_failed(uuid,text,text,boolean)
to authenticated;