-- Canonical Paymob marketplace transaction-state applicator.
-- Keeps provider-state normalization/monotonic transition and local order/payment
-- synchronization in one service-role-only contract so webhook and reconciliation
-- paths can reuse the same state transition boundary.

create or replace function public.velora_apply_paymob_marketplace_transaction(
  p_payment_attempt_id uuid,
  p_provider_transaction_id text,
  p_incoming_status text,
  p_source text default 'webhook'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_role text := coalesce(auth.role(),'');
  v_attempt public.payment_attempts%rowtype;
  v_order_status text;
  v_current_status text;
  v_incoming text := lower(trim(coalesce(p_incoming_status,'')));
  v_effective text;
  v_order_payment_status public.payment_status;
  v_now timestamptz := now();
  v_method_code text := '';
  v_payment_id uuid;
  v_state_changed boolean := false;
begin
  if v_role <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  if p_payment_attempt_id is null
     or nullif(trim(coalesce(p_provider_transaction_id,'')),'') is null then
    raise exception 'PAYMOB_TRANSACTION_APPLICATOR_FIELDS_REQUIRED';
  end if;

  if v_incoming not in ('pending','requires_action','authorized','captured','failed','refunded','cancelled') then
    raise exception 'PAYMOB_TRANSACTION_STATUS_INVALID';
  end if;

  select *
    into v_attempt
  from public.payment_attempts
  where id = p_payment_attempt_id
    and purpose = 'marketplace_order'
  for update;

  if not found then
    raise exception 'MARKETPLACE_PAYMENT_ATTEMPT_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.payment_providers pp
    where pp.id = v_attempt.provider_id
      and lower(trim(pp.code)) = 'paymob'
  ) then
    raise exception 'PAYMOB_PROVIDER_REQUIRED';
  end if;

  if v_attempt.metadata->>'paymob_order_id' is null then
    raise exception 'PAYMOB_ORDER_CORRELATION_MISSING';
  end if;

  v_current_status := lower(coalesce(v_attempt.status,'pending'));

  v_effective := case
    when v_current_status = '' then v_incoming
    when v_current_status = 'refunded' then 'refunded'
    when v_current_status in ('failed','cancelled') then v_current_status
    when v_current_status = 'captured'
      then case when v_incoming = 'refunded' then 'refunded' else 'captured' end
    when v_current_status = 'authorized'
      then case
        when v_incoming in ('captured','refunded','failed','cancelled') then v_incoming
        else 'authorized'
      end
    when v_current_status = 'requires_action'
      then case
        when v_incoming in ('authorized','captured','refunded','failed','cancelled') then v_incoming
        else 'requires_action'
      end
    else v_incoming
  end;

  v_state_changed := v_effective is distinct from v_current_status
    or coalesce(v_attempt.provider_payment_id,'') is distinct from trim(p_provider_transaction_id);

  update public.payment_attempts
  set status = v_effective,
      provider_payment_id = trim(p_provider_transaction_id),
      payment_reference = trim(p_provider_transaction_id),
      authorized_at = case
        when v_effective = 'authorized' then coalesce(authorized_at,v_now)
        else authorized_at
      end,
      captured_at = case
        when v_effective = 'captured' then coalesce(captured_at,v_now)
        else captured_at
      end,
      completed_at = case
        when v_effective in ('captured','refunded','failed','cancelled') then coalesce(completed_at,v_now)
        else completed_at
      end,
      updated_at = v_now
  where id = v_attempt.id
  returning * into v_attempt;

  v_order_payment_status := case
    when v_effective = 'captured' then 'paid'::public.payment_status
    when v_effective = 'refunded' then 'refunded'::public.payment_status
    when v_effective = 'failed' then 'failed'::public.payment_status
    when v_effective = 'cancelled' then 'cancelled'::public.payment_status
    else 'pending'::public.payment_status
  end;

  select o.status::text
    into v_order_status
  from public.orders o
  where o.id = v_attempt.order_id
  for update;

  if v_attempt.order_id is null or v_order_status is null then
    raise exception 'MARKETPLACE_PAYMENT_ORDER_MISSING';
  end if;

  update public.orders
  set payment_status = v_order_payment_status,
      status = case
        when v_effective = 'captured' and v_order_status = 'pending'
          then 'confirmed'::public.order_status
        else status
      end,
      updated_at = v_now
  where id = v_attempt.order_id;

  select pm.code
    into v_method_code
  from public.payment_methods pm
  where pm.id = v_attempt.method_id;

  if v_method_code <> '' then
    select p.id
      into v_payment_id
    from public.payments p
    where p.order_id = v_attempt.order_id
      and p.method = lower(trim(v_method_code))
      and p.status = 'pending'
    order by p.created_at desc, p.id desc
    limit 1;

    if v_payment_id is not null then
      update public.payments
      set status = v_order_payment_status,
          provider = 'paymob',
          provider_payment_id = trim(p_provider_transaction_id),
          paid_at = case when v_order_payment_status = 'paid' then coalesce(paid_at,v_now) else paid_at end,
          updated_at = v_now
      where id = v_payment_id;
    end if;
  end if;

  if v_state_changed then
    insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
    values(
      null,
      'paymob_transaction_reconciled',
      'order',
      v_attempt.order_id,
      jsonb_build_object(
        'transaction_id', trim(p_provider_transaction_id),
        'payment_attempt_id', v_attempt.id,
        'payment_status', v_effective,
        'order_status', case
          when v_effective = 'captured' and v_order_status = 'pending' then 'confirmed'
          else v_order_status
        end,
        'source', lower(trim(coalesce(p_source,'webhook')))
      )
    );
  end if;

  return jsonb_build_object(
    'ok',true,
    'changed',v_state_changed,
    'payment_attempt_id',v_attempt.id,
    'order_id',v_attempt.order_id,
    'status',v_effective,
    'transaction_id',trim(p_provider_transaction_id),
    'source',lower(trim(coalesce(p_source,'webhook')))
  );
end;
$function$;

revoke execute on function public.velora_apply_paymob_marketplace_transaction(uuid,text,text,text) from anon, authenticated;
grant execute on function public.velora_apply_paymob_marketplace_transaction(uuid,text,text,text) to service_role;
