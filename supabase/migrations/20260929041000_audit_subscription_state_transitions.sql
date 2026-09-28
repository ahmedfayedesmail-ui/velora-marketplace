-- Velora Restore-Test only.
-- Audit real seller subscription financial state transitions using the existing
-- audit trail. No new event table or state engine is introduced.

create or replace function public.velora_sync_subscription_state(
  p_seller_subscription_id uuid
)
returns public.seller_subscriptions
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_sub public.seller_subscriptions%rowtype;
  v_before public.seller_subscriptions%rowtype;
  v_latest_status text;
  v_latest_captured_id uuid;
  v_new_status text;
  v_new_payment_status public.payment_status;
  v_changed boolean := false;
begin
  if p_seller_subscription_id is null then
    raise exception 'SUBSCRIPTION_REQUIRED';
  end if;

  select * into v_sub
  from public.seller_subscriptions
  where id=p_seller_subscription_id
  for update;

  if not found then
    raise exception 'SUBSCRIPTION_NOT_FOUND';
  end if;

  v_before := v_sub;

  select pa.status into v_latest_status
  from public.payment_attempts pa
  where pa.seller_subscription_id=p_seller_subscription_id
    and pa.purpose='subscription'
  order by pa.created_at desc,pa.id desc
  limit 1;

  select pa.id into v_latest_captured_id
  from public.payment_attempts pa
  where pa.seller_subscription_id=p_seller_subscription_id
    and pa.purpose='subscription'
    and pa.status in ('captured','refunded')
    and pa.captured_at is not null
  order by pa.captured_at desc,pa.created_at desc,pa.id desc
  limit 1;

  v_new_status:=v_sub.status;
  v_new_payment_status:=v_sub.payment_status;

  if v_latest_status is not null then
    v_new_payment_status:=case v_latest_status
      when 'captured' then 'paid'::public.payment_status
      when 'refunded' then 'refunded'::public.payment_status
      when 'failed' then 'failed'::public.payment_status
      when 'cancelled' then 'cancelled'::public.payment_status
      when 'pending' then 'pending'::public.payment_status
      when 'requires_action' then 'pending'::public.payment_status
      when 'authorized' then 'pending'::public.payment_status
      else v_sub.payment_status
    end;
  end if;

  case v_sub.status
    when 'pending' then
      if v_sub.pending_expires_at is not null
         and v_sub.pending_expires_at<=now()
         and v_latest_status is distinct from 'captured' then
        v_new_status:='cancelled';
        v_new_payment_status:='cancelled'::public.payment_status;
      elsif v_latest_status='captured' then
        v_new_status:='active';
        if v_sub.started_at is null then v_sub.started_at:=now(); end if;
        if v_sub.expires_at is null then
          v_sub.expires_at:=case v_sub.billing_cycle
            when 'monthly' then v_sub.started_at+interval '30 days'
            when 'yearly' then v_sub.started_at+interval '1 year'
            else null
          end;
        end if;
        if v_sub.expires_at is null then
          raise exception 'INVALID_BILLING_CYCLE';
        end if;
        v_new_payment_status:='paid'::public.payment_status;
      end if;

    when 'active' then
      if v_sub.expires_at is not null
         and v_sub.expires_at<=now()
         and v_sub.cancel_at is not null
         and v_sub.cancel_at<=now() then
        v_new_status:='cancelled';
      elsif v_sub.expires_at is not null
         and v_sub.expires_at<=now()
         and v_sub.cancel_at is null
         and v_latest_status is distinct from 'captured' then
        v_new_status:='past_due';
      elsif v_latest_status='captured' then
        v_new_status:='active';
        v_new_payment_status:='paid'::public.payment_status;
      end if;

    when 'past_due' then
      if v_latest_status='captured' then
        v_new_status:='active';
        v_new_payment_status:='paid'::public.payment_status;
      elsif v_sub.expires_at is not null
         and v_sub.expires_at+interval '7 days'<=now() then
        v_new_status:='expired';
      end if;

    when 'cancelled' then
      null;
    when 'expired' then
      null;
    else
      raise exception 'INVALID_SUBSCRIPTION_STATUS';
  end case;

  if v_latest_captured_id is not null then
    v_sub.payment_id:=v_latest_captured_id;
  end if;

  update public.seller_subscriptions
  set status=v_new_status,
      payment_status=v_new_payment_status,
      payment_id=v_sub.payment_id,
      started_at=coalesce(v_sub.started_at,seller_subscriptions.started_at),
      expires_at=coalesce(v_sub.expires_at,seller_subscriptions.expires_at),
      updated_at=case
        when status is distinct from v_new_status
          or payment_status is distinct from v_new_payment_status
          or payment_id is distinct from v_sub.payment_id
          or started_at is distinct from v_sub.started_at
          or expires_at is distinct from v_sub.expires_at
        then now() else updated_at end
  where id=p_seller_subscription_id
  returning * into v_sub;

  v_changed :=
       v_before.status is distinct from v_sub.status
    or v_before.payment_status is distinct from v_sub.payment_status
    or v_before.payment_id is distinct from v_sub.payment_id
    or v_before.started_at is distinct from v_sub.started_at
    or v_before.expires_at is distinct from v_sub.expires_at;

  if v_changed then
    insert into public.audit_logs(
      actor_id,
      action,
      entity_type,
      entity_id,
      metadata
    )
    values(
      null,
      'seller_subscription_state_changed',
      'seller_subscription',
      v_sub.id,
      jsonb_build_object(
        'seller_id',(select s.id from public.sellers s join public.stores st on st.id=v_sub.store_id where st.owner_id=s.user_id limit 1),
        'store_id',v_sub.store_id,
        'previous_status',v_before.status,
        'new_status',v_sub.status,
        'previous_payment_status',v_before.payment_status,
        'new_payment_status',v_sub.payment_status,
        'previous_payment_id',v_before.payment_id,
        'new_payment_id',v_sub.payment_id,
        'started_at',v_sub.started_at,
        'expires_at',v_sub.expires_at,
        'source','subscription_state_sync'
      )
    );
  end if;

  if v_sub.status in ('cancelled','expired') then
    update public.seller_subscription_renewal_jobs
    set status='cancelled',
        next_attempt_at=null,
        lease_until=null,
        last_error_code=case when v_sub.status='expired' then 'RENEWAL_GRACE_EXPIRED' else 'SUBSCRIPTION_CANCELLED' end,
        last_error_message=case when v_sub.status='expired' then 'Renewal grace period ended' else 'Subscription cancelled before renewal completion' end,
        updated_at=now()
    where seller_subscription_id=v_sub.id
      and status in ('queued','in_progress','awaiting_customer','failed');

    update public.notification_lifecycle_jobs
    set status='cancelled',
        cancelled_at=now()
    where kind in ('subscription_expiry_t5','subscription_expiry_t1')
      and status='pending'
      and payload->>'subscription_series_id'=v_sub.subscription_series_id::text;

  elsif v_sub.status='active' and v_sub.expires_at is not null then
    perform public.velora_schedule_subscription_expiry_notification_jobs(v_sub.id);
  end if;

  return v_sub;
end;
$function$;
