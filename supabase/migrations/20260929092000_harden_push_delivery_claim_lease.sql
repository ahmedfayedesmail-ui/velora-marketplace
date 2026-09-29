-- Velora Push Delivery Claim/Lease Integrity
-- Restore-Test first. Production remains FROZEN.
--
-- Existing table already has:
--   (notification_id, subscription_id) primary key
--   claimed_at for in-flight claiming
--   delivered_at for delivery evidence
-- This migration fixes the semantic boundary without adding another queue/engine.
--
-- Contract:
--   claim = temporary lease
--   send success = delivered_at
--   send failure = claim is cleared
--   worker crash = stale claim may be reclaimed
-- Delivery is at-least-once across process crashes; exact-once cannot be guaranteed
-- by the browser push transport itself.

alter table public.notification_push_deliveries
  alter column delivered_at drop default;

create or replace function public.velora_claim_push_delivery(
  p_notification_id uuid,
  p_subscription_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'pg_catalog'
as $function$
begin
  insert into public.notification_push_deliveries(
    notification_id,
    subscription_id,
    claimed_at,
    delivered_at
  )
  values(
    p_notification_id,
    p_subscription_id,
    now(),
    null
  )
  on conflict (notification_id, subscription_id) do update
  set claimed_at = now()
  where notification_push_deliveries.delivered_at is null
    and (
      notification_push_deliveries.claimed_at is null
      or notification_push_deliveries.claimed_at < now() - interval '10 minutes'
    );

  return found;
end;
$function$;

create or replace function public.velora_mark_push_delivery(
  p_notification_id uuid,
  p_subscription_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = 'public', 'pg_catalog'
as $function$
begin
  update public.notification_push_deliveries
  set delivered_at = now(),
      claimed_at = coalesce(claimed_at, now())
  where notification_id = p_notification_id
    and subscription_id = p_subscription_id
    and delivered_at is null;

  return found;
end;
$function$;

create or replace function public.velora_unmark_push_delivery(
  p_notification_id uuid,
  p_subscription_id uuid
)
returns boolean
language sql
security definer
set search_path = 'public', 'pg_catalog'
as $function$
  delete from public.notification_push_deliveries
  where notification_id=p_notification_id
    and subscription_id=p_subscription_id
    and delivered_at is null
  returning true;
$function$;
