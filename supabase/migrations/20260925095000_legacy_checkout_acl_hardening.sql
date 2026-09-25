-- Restore-Test / staging only. Production remains frozen.
revoke all on table public.recommendation_runs from anon,authenticated;
revoke all on table public.recommendation_feedback from anon,authenticated;
revoke all on table public.recommendation_impressions from anon,authenticated;
revoke all on function public.velora_remove_cart_item_variant(uuid,uuid) from public;
grant execute on function public.velora_remove_cart_item_variant(uuid,uuid) to authenticated;
create unique index if not exists orders_customer_checkout_reference_uidx on public.orders(customer_id,checkout_reference) where checkout_reference is not null;
revoke all on function public.velora_create_order(jsonb,text,numeric,text,text,text,text,text,text,text) from public;
grant execute on function public.velora_create_order(jsonb,text,numeric,text,text,text,text,text,text,text) to authenticated;
revoke all on function public.velora_create_order_with_commercials(jsonb,text,numeric,text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.velora_create_order_with_commercials(jsonb,text,numeric,text,text,text,text,text,text,text,text,text) to authenticated;
