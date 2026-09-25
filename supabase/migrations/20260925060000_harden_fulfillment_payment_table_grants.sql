-- Restore-Test least-privilege hardening for internal fulfillment/payment tables.
-- Keep authenticated SELECT where explicit RLS read policies allow it.
-- Remove anonymous access and direct browser writes; writes flow through secured RPCs/services.

revoke all on table public.orders from anon;
revoke insert, update, delete, references, trigger on table public.orders from authenticated;

revoke all on table public.order_items from anon;
revoke insert, update, delete, references, trigger on table public.order_items from authenticated;

revoke all on table public.shipments from anon;
revoke insert, update, delete, references, trigger on table public.shipments from authenticated;

revoke all on table public.shipment_items from anon;
revoke insert, update, delete, references, trigger on table public.shipment_items from authenticated;

revoke all on table public.payment_attempts from anon;
revoke insert, update, delete, references, trigger on table public.payment_attempts from authenticated;

revoke all on table public.provider_webhook_events from anon;
revoke all on table public.provider_webhook_events from authenticated;
