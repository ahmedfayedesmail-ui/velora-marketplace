-- Rollback S2-A hotfix 2.
ALTER FUNCTION public.velora_upsert_cart_item_variant(uuid,uuid,integer,text)
  SECURITY INVOKER;
