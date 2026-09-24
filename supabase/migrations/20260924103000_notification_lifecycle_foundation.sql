-- Velora S1-D — Notification Lifecycle foundation
-- Restore-Test / staging only. Production remains frozen.
--
-- This layer schedules server-side notification jobs after an order is
-- delivered/completed. It does not send anything by itself; a scheduler/worker
-- will process due jobs. That keeps delivery independent of the browser.

create table if not exists public.notification_lifecycle_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  due_at timestamptz not null,
  entity_type text,
  entity_id uuid,
  dedupe_key text not null unique,
  status text not null default 'pending'
    check (status in ('pending','sent','cancelled')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists idx_notification_lifecycle_due
  on public.notification_lifecycle_jobs(status, due_at);

create index if not exists idx_notification_lifecycle_user
  on public.notification_lifecycle_jobs(user_id, kind, status);

alter table public.notification_lifecycle_jobs enable row level security;

drop policy if exists notification_lifecycle_self_select
  on public.notification_lifecycle_jobs;
create policy notification_lifecycle_self_select
on public.notification_lifecycle_jobs
for select to authenticated
using (user_id = auth.uid() or public.velora_is_staff());

create or replace function private.velora_lifecycle_interval_days(p_subcategory text)
returns integer
language sql
immutable
as $function$
  select case
    when lower(coalesce(p_subcategory,'')) in ('sunscreen','spf') then 45
    when lower(coalesce(p_subcategory,'')) in ('serum','anti_aging','treatment') then 90
    when lower(coalesce(p_subcategory,'')) in ('cleanser','moisturizer','cream') then 60
    else 60
  end;
$function$;

create or replace function private.velora_schedule_order_lifecycle_jobs()
returns trigger
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
declare
  v_item record;
  v_delivered_at timestamptz;
  v_interval integer;
begin
  if new.customer_id is null then
    return new;
  end if;

  if lower(coalesce(new.status::text,'')) not in ('delivered','completed') then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and lower(coalesce(old.status::text,'')) in ('delivered','completed')
     and new.status is not distinct from old.status
  then
    return new;
  end if;

  v_delivered_at := coalesce(new.updated_at, now());

  for v_item in
    select
      oi.id as order_item_id,
      oi.product_id,
      oi.product_name,
      p.subcategory
    from public.order_items oi
    left join public.products p on p.id = oi.product_id
    where oi.order_id = new.id
  loop
    -- Experience check-in: 3 days after delivery.
    insert into public.notification_lifecycle_jobs(
      user_id, kind, due_at, entity_type, entity_id, dedupe_key, payload
    )
    values(
      new.customer_id,
      'experience_checkin',
      v_delivered_at + interval '3 days',
      'order_item',
      v_item.order_item_id,
      'experience_checkin:' || v_item.order_item_id::text,
      jsonb_build_object(
        'order_id', new.id,
        'order_number', new.order_number,
        'order_item_id', v_item.order_item_id,
        'product_id', v_item.product_id,
        'product_name', v_item.product_name
      )
    )
    on conflict (dedupe_key) do nothing;

    -- Replenishment: product-type baseline, intentionally conservative.
    v_interval := private.velora_lifecycle_interval_days(v_item.subcategory);
    insert into public.notification_lifecycle_jobs(
      user_id, kind, due_at, entity_type, entity_id, dedupe_key, payload
    )
    values(
      new.customer_id,
      'replenishment',
      v_delivered_at + (v_interval * interval '1 day'),
      'product',
      v_item.product_id,
      'replenishment:' || v_item.order_item_id::text,
      jsonb_build_object(
        'order_id', new.id,
        'order_number', new.order_number,
        'order_item_id', v_item.order_item_id,
        'product_id', v_item.product_id,
        'product_name', v_item.product_name,
        'interval_days', v_interval
      )
    )
    on conflict (dedupe_key) do nothing;
  end loop;

  return new;
end;
$function$;

drop trigger if exists trg_velora_lifecycle_order_jobs on public.orders;
create trigger trg_velora_lifecycle_order_jobs
after insert or update of status on public.orders
for each row
execute function private.velora_schedule_order_lifecycle_jobs();

create or replace function private.velora_cancel_feedback_lifecycle_job(
  p_order_item_id uuid
)
returns integer
language sql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
  with cancelled as (
    update public.notification_lifecycle_jobs
    set status = 'cancelled',
        cancelled_at = now()
    where entity_type = 'order_item'
      and entity_id = p_order_item_id
      and kind = 'experience_checkin'
      and status = 'pending'
    returning 1
  )
  select count(*)::integer from cancelled;
$function$;

create or replace function private.velora_feedback_lifecycle_trigger()
returns trigger
language plpgsql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
begin
  if new.source = 'purchase' and new.order_item_id is not null then
    perform private.velora_cancel_feedback_lifecycle_job(new.order_item_id);
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_velora_feedback_lifecycle on public.beauty_feedback;
create trigger trg_velora_feedback_lifecycle
after insert on public.beauty_feedback
for each row
execute function private.velora_feedback_lifecycle_trigger();

-- Generic server-side processor. A scheduler/worker will call this after it
-- is secured with a server credential. It creates the existing in-app
-- notification and marks the job sent atomically per job.
create or replace function private.velora_process_notification_lifecycle(
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
begin
  for v_job in
    select *
    from public.notification_lifecycle_jobs
    where status = 'pending'
      and due_at <= now()
    order by due_at, id
    limit greatest(least(coalesce(p_limit,100),500),1)
    for update skip locked
  loop
    if v_job.kind = 'experience_checkin' then
      select exists(
        select 1
        from public.beauty_feedback bf
        where bf.order_item_id = (v_job.payload->>'order_item_id')::uuid
          and bf.user_id = v_job.user_id
      ) into v_has_feedback;

      if v_has_feedback then
        update public.notification_lifecycle_jobs
        set status='cancelled', cancelled_at=now()
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
        set status='sent', sent_at=now()
        where id=v_job.id;

        v_count := v_count + 1;
      end if;

    elsif v_job.kind = 'replenishment' then
      select exists(
        select 1
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where o.customer_id = v_job.user_id
          and oi.product_id = (v_job.payload->>'product_id')::uuid
          and lower(coalesce(o.status::text,'')) in ('delivered','completed')
          and o.created_at > (
            select o2.created_at
            from public.order_items oi2
            join public.orders o2 on o2.id = oi2.order_id
            where oi2.id = (v_job.payload->>'order_item_id')::uuid
            limit 1
          )
      ) into v_newer_purchase;

      if v_newer_purchase then
        update public.notification_lifecycle_jobs
        set status='cancelled', cancelled_at=now()
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
        set status='sent', sent_at=now()
        where id=v_job.id;

        v_count := v_count + 1;
      end if;
    else
      update public.notification_lifecycle_jobs
      set status='cancelled', cancelled_at=now()
      where id=v_job.id;
    end if;
  end loop;

  return v_count;
end;
$function$;

