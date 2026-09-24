-- ============================================================
-- VELORA NOTIFICATION PUSH HARDENING
-- Atomic delivery claim + lifecycle processor hardening.
-- ============================================================

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
  insert into public.notification_push_deliveries(notification_id, subscription_id)
  values (p_notification_id, p_subscription_id)
  on conflict (notification_id, subscription_id) do nothing;

  return found;
end;
$function$;

revoke all on function public.velora_claim_push_delivery(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.velora_claim_push_delivery(uuid, uuid)
to service_role;

revoke execute on function public.velora_process_notification_lifecycle(integer)
from public, anon, authenticated;
grant execute on function public.velora_process_notification_lifecycle(integer)
to service_role;
