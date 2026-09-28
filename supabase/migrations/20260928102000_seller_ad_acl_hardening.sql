-- VELORA — Seller Advertising ACL Hardening
-- Keep public ad discovery public; keep seller checkout APIs authenticated;
-- keep campaign state synchronization internal to service_role/webhook lifecycle.

revoke all on function public.velora_sync_seller_ad_campaign(uuid) from public, anon, authenticated;
grant execute on function public.velora_sync_seller_ad_campaign(uuid) to service_role;

revoke all on function public.velora_get_seller_ad_checkout_context() from public, anon;
grant execute on function public.velora_get_seller_ad_checkout_context() to authenticated;

revoke all on function public.velora_create_seller_ad_payment_attempt(uuid,uuid,text,text) from public, anon;
grant execute on function public.velora_create_seller_ad_payment_attempt(uuid,uuid,text,text) to authenticated;

revoke all on function public.velora_attach_seller_ad_payment_provider_session(uuid,text,text,text) from public, anon;
grant execute on function public.velora_attach_seller_ad_payment_provider_session(uuid,text,text,text) to authenticated;

revoke all on function public.velora_start_seller_ad_purchase(uuid,uuid,text,text) from public, anon;
grant execute on function public.velora_start_seller_ad_purchase(uuid,uuid,text,text) to authenticated;
