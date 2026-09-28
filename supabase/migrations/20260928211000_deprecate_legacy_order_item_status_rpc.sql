-- Deprecate the legacy order-item status RPC without changing the canonical order/shipment lifecycle.
-- Current order_items has no status column and no order_item_status enum.
-- The canonical lifecycle is carried by public.orders and public.shipments.
-- Keep the historical function definition for compatibility/forensics, but remove Data API execution
-- so clients cannot reach a broken legacy contract.
-- Production remains FROZEN.

revoke execute on function public.velora_update_order_item_status(uuid, text, text)
  from public, anon, authenticated;

comment on function public.velora_update_order_item_status(uuid, text, text)
is 'DEPRECATED legacy compatibility RPC. Current lifecycle authority is orders/shipments; order_items has no status column. Do not call from client/Data API. Retained only for historical compatibility/forensics.';
