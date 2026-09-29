-- Align live Restore-Test push-delivery claim lease with canonical recovery contract.
-- Infrastructure lease only; not a customer notification TTL.

alter table public.notification_push_deliveries
  alter column delivered_at drop not null;

alter table public.notification_push_deliveries
  add column if not exists claimed_at timestamptz;

update public.notification_push_deliveries
set claimed_at=coalesce(claimed_at, delivered_at)
where claimed_at is null;

create index if not exists idx_notification_push_deliveries_claimed
  on public.notification_push_deliveries (claimed_at)
  where delivered_at is null;

create or replace function public.velora_claim_push_delivery(
  p_notification_id uuid,
  p_subscription_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_claimed_at timestamptz;
  v_delivered_at timestamptz;
begin
  insert into public.notification_push_deliveries(
    notification_id, subscription_id, claimed_at, delivered_at
  )
  values(p_notification_id, p_subscription_id, now(), null)
  on conflict (notification_id, subscription_id) do nothing;

  if found then return true; end if;

  select claimed_at, delivered_at into v_claimed_at, v_delivered_at
  from public.notification_push_deliveries
  where notification_id=p_notification_id and subscription_id=p_subscription_id
  for update;

  if v_delivered_at is not null then return false; end if;

  if v_claimed_at is null or v_claimed_at < now() - interval '5 minutes' then
    update public.notification_push_deliveries
    set claimed_at=now()
    where notification_id=p_notification_id
      and subscription_id=p_subscription_id
      and delivered_at is null;
    return found;
  end if;

  return false;
end;
$function$;

create or replace function public.velora_mark_push_delivery(
  p_notification_id uuid,
  p_subscription_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  update public.notification_push_deliveries
  set delivered_at=now()
  where notification_id=p_notification_id
    and subscription_id=p_subscription_id
    and delivered_at is null;
  return found;
end;
$function$;

create or replace function public.velora_unmark_push_delivery(
  p_notification_id uuid,
  p_subscription_id uuid
) returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $function$
  delete from public.notification_push_deliveries
  where notification_id=p_notification_id
    and subscription_id=p_subscription_id
    and delivered_at is null
  returning true;
$function$;

revoke execute on function public.velora_claim_push_delivery(uuid,uuid) from anon, authenticated;
revoke execute on function public.velora_mark_push_delivery(uuid,uuid) from anon, authenticated;
revoke execute on function public.velora_unmark_push_delivery(uuid,uuid) from anon, authenticated;
