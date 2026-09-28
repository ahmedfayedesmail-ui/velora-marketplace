-- Subscription expiry reminders on the existing notification lifecycle engine.
-- No new scheduler/framework: reuse notification_lifecycle_jobs + existing pg_cron processor.
-- Reminders are deduped by subscription series + exact expiry timestamp + reminder kind.
-- A renewed subscription invalidates older pending reminders in the same series.

create or replace function public.velora_schedule_subscription_expiry_notification_jobs(
  p_seller_subscription_id uuid
)
returns integer
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
declare
  v_sub public.seller_subscriptions%rowtype;
  v_user_id uuid;
  v_series text;
  v_expires_at timestamptz;
  v_plan_name text;
  v_count integer := 0;
begin
  select ss.*, st.owner_id, sp.name
    into v_sub, v_user_id, v_plan_name
  from public.seller_subscriptions ss
  join public.stores st on st.id=ss.store_id
  join public.subscription_plans sp on sp.id=ss.plan_id
  where ss.id=p_seller_subscription_id
    and ss.status='active'
    and ss.expires_at is not null
  limit 1;

  if not found or v_user_id is null then
    return 0;
  end if;

  v_series := v_sub.subscription_series_id::text;
  v_expires_at := v_sub.expires_at;

  -- Any pending reminder for the same subscription series but an older
  -- expiry belongs to a superseded period and must not be delivered.
  update public.notification_lifecycle_jobs
  set status='cancelled',
      cancelled_at=now()
  where kind in ('subscription_expiry_t5','subscription_expiry_t1')
    and status='pending'
    and payload->>'subscription_series_id' = v_series
    and payload->>'expires_at' is distinct from v_expires_at::text;

  insert into public.notification_lifecycle_jobs(
    user_id, kind, due_at, entity_type, entity_id, dedupe_key, payload
  )
  values(
    v_user_id,
    'subscription_expiry_t5',
    greatest(now(), v_expires_at - interval '5 days'),
    'seller_subscription',
    v_sub.id,
    'subscription_expiry:' || v_series || ':' ||
      extract(epoch from v_expires_at)::bigint || ':t5',
    jsonb_build_object(
      'subscription_id', v_sub.id,
      'subscription_series_id', v_series,
      'expires_at', v_expires_at,
      'plan_name', v_plan_name,
      'reminder_days', 5
    )
  )
  on conflict (dedupe_key) do nothing;

  get diagnostics v_count = row_count;

  insert into public.notification_lifecycle_jobs(
    user_id, kind, due_at, entity_type, entity_id, dedupe_key, payload
  )
  values(
    v_user_id,
    'subscription_expiry_t1',
    greatest(now(), v_expires_at - interval '1 day'),
    'seller_subscription',
    v_sub.id,
    'subscription_expiry:' || v_series || ':' ||
      extract(epoch from v_expires_at)::bigint || ':t1',
    jsonb_build_object(
      'subscription_id', v_sub.id,
      'subscription_series_id', v_series,
      'expires_at', v_expires_at,
      'plan_name', v_plan_name,
      'reminder_days', 1
    )
  )
  on conflict (dedupe_key) do nothing;

  v_count := v_count + 0;
  return v_count;
end;
$function$;

create or replace function public.velora_process_notification_lifecycle(
  p_limit integer default 100
)
returns integer
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
declare
  v_job record;
  v_count integer := 0;
  v_has_feedback boolean;
  v_newer_purchase boolean;
  v_subscription_current boolean;
  v_reminder_days integer;
  v_notification_type text;
begin
  for v_job in
    select *
    from public.notification_lifecycle_jobs
    where status='pending'
      and due_at<=now()
    order by due_at,id
    limit greatest(least(coalesce(p_limit,100),500),1)
    for update skip locked
  loop
    if v_job.kind='experience_checkin' then
      select exists(
        select 1
        from public.beauty_feedback bf
        where bf.order_item_id=(v_job.payload->>'order_item_id')::uuid
          and bf.user_id=v_job.user_id
      ) into v_has_feedback;

      if v_has_feedback then
        update public.notification_lifecycle_jobs
        set status='cancelled',cancelled_at=now()
        where id=v_job.id;
      else
        perform private.velora_create_notification(
          v_job.user_id,
          'beauty_experience',
          'How is your new product working for you?',
          'Tell Velora how ' ||
            coalesce(v_job.payload->>'product_name','your product') ||
            ' feels so we can improve your Beauty Journey.',
          v_job.entity_type,
          v_job.entity_id
        );

        update public.notification_lifecycle_jobs
        set status='sent',sent_at=now()
        where id=v_job.id;

        v_count:=v_count+1;
      end if;

    elsif v_job.kind='replenishment' then
      select exists(
        select 1
        from public.order_items oi
        join public.orders o on o.id=oi.order_id
        where o.customer_id=v_job.user_id
          and oi.product_id=(v_job.payload->>'product_id')::uuid
          and lower(coalesce(o.status::text,'')) in ('delivered','completed')
          and o.created_at>(
            select o2.created_at
            from public.order_items oi2
            join public.orders o2 on o2.id=oi2.order_id
            where oi2.id=(v_job.payload->>'order_item_id')::uuid
            limit 1
          )
      ) into v_newer_purchase;

      if v_newer_purchase then
        update public.notification_lifecycle_jobs
        set status='cancelled',cancelled_at=now()
        where id=v_job.id;
      else
        perform private.velora_create_notification(
          v_job.user_id,
          'replenishment',
          'It may be time to replenish a beauty essential',
          coalesce(v_job.payload->>'product_name','A product') ||
            ' may be approaching its refill window.',
          v_job.entity_type,
          v_job.entity_id
        );

        update public.notification_lifecycle_jobs
        set status='sent',sent_at=now()
        where id=v_job.id;

        v_count:=v_count+1;
      end if;

    elsif v_job.kind in ('subscription_expiry_t5','subscription_expiry_t1') then
      select exists(
        select 1
        from public.seller_subscriptions ss
        where ss.id=v_job.entity_id
          and ss.status='active'
          and ss.expires_at is not null
          and ss.expires_at>now()
          and ss.subscription_series_id::text =
              v_job.payload->>'subscription_series_id'
          and ss.expires_at::text =
              v_job.payload->>'expires_at'
      ) into v_subscription_current;

      if not v_subscription_current then
        update public.notification_lifecycle_jobs
        set status='cancelled',cancelled_at=now()
        where id=v_job.id;
      else
        v_reminder_days:=case
          when v_job.kind='subscription_expiry_t5' then 5
          else 1
        end;
        v_notification_type:=case
          when v_job.kind='subscription_expiry_t5'
            then 'seller_subscription_expiry_t5'
          else 'seller_subscription_expiry_t1'
        end;

        perform private.velora_create_notification(
          v_job.user_id,
          v_notification_type,
          'Seller subscription renewal reminder',
          case v_reminder_days
            when 5 then 'Your seller subscription expires in 5 days. Renew to keep paid seller benefits active.'
            else 'Your seller subscription expires tomorrow. Renew to keep paid seller benefits active.'
          end,
          v_job.entity_type,
          v_job.entity_id
        );

        update public.notification_lifecycle_jobs
        set status='sent',sent_at=now()
        where id=v_job.id;

        v_count:=v_count+1;
      end if;

    else
      update public.notification_lifecycle_jobs
      set status='cancelled',cancelled_at=now()
      where id=v_job.id;
    end if;
  end loop;

  return v_count;
end;
$function$;

create or replace function public.velora_sync_subscription_state(
  p_seller_subscription_id uuid
)
returns seller_subscriptions
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_sub public.seller_subscriptions%rowtype;
  v_latest_status text;
  v_latest_captured_id uuid;
  v_new_status text;
  v_new_payment_status public.payment_status;
begin
  if p_seller_subscription_id is null then
    raise exception 'SUBSCRIPTION_REQUIRED';
  end if;

  select *
    into v_sub
  from public.seller_subscriptions
  where id=p_seller_subscription_id
  for update;

  if not found then
    raise exception 'SUBSCRIPTION_NOT_FOUND';
  end if;

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

    when 'cancelled' then null;
    when 'expired' then null;
    else raise exception 'INVALID_SUBSCRIPTION_STATUS';
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

  if v_sub.status in ('cancelled','expired') then
    update public.seller_subscription_renewal_jobs
    set status='cancelled',
        next_attempt_at=null,
        lease_until=null,
        last_error_code=case
          when v_sub.status='expired' then 'RENEWAL_GRACE_EXPIRED'
          else 'SUBSCRIPTION_CANCELLED'
        end,
        last_error_message=case
          when v_sub.status='expired' then 'Renewal grace period ended'
          else 'Subscription cancelled before renewal completion'
        end,
        updated_at=now()
    where seller_subscription_id=v_sub.id
      and status in ('queued','in_progress','awaiting_customer','failed');

    update public.notification_lifecycle_jobs
    set status='cancelled',cancelled_at=now()
    where kind in ('subscription_expiry_t5','subscription_expiry_t1')
      and status='pending'
      and payload->>'subscription_series_id' =
          v_sub.subscription_series_id::text;
  elsif v_sub.status='active' and v_sub.expires_at is not null then
    perform public.velora_schedule_subscription_expiry_notification_jobs(v_sub.id);
  end if;

  return v_sub;
end;
$function$;
