-- Rollback S2-A hotfix 1.
-- Restores INVOKER security behavior. This intentionally restores the pre-hotfix state.
ALTER FUNCTION public.velora_upsert_product_variant(uuid,uuid,text,text,numeric,integer,jsonb)
  SECURITY INVOKER;
ALTER FUNCTION public.velora_retire_product_variant(uuid)
  SECURITY INVOKER;
