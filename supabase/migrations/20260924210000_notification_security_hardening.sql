-- ============================================================
-- VELORA NOTIFICATION SECURITY HARDENING
-- Remove direct table access from API roles and restrict internal
-- delivery helpers to service_role.
-- ============================================================

revoke all on table
  public.notifications,
  public.push_subscriptions,
  public.notification_push_deliveries,
  public.notification_lifecycle_jobs
from anon, authenticated;

revoke execute on function public.velora_mark_push_delivery(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.velora_mark_push_delivery(uuid, uuid)
to service_role;

revoke execute on function public.velora_unmark_push_delivery(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.velora_unmark_push_delivery(uuid, uuid)
to service_role;

revoke execute on function public.velora_register_push_subscription(text, text, text, text)
from anon;
grant execute on function public.velora_register_push_subscription(text, text, text, text)
to authenticated;

revoke execute on function public.velora_unregister_push_subscription(text)
from anon;
grant execute on function public.velora_unregister_push_subscription(text)
to authenticated;
