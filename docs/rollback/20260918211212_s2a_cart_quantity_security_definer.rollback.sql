-- Rollback S2-A hotfix 3.
ALTER FUNCTION public.velora_set_cart_quantity_variant(uuid,uuid,integer)
  SECURITY INVOKER;
