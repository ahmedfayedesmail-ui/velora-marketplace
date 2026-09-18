-- S2-A hotfix 1: variant writer must execute through controlled SECURITY DEFINER context.
-- Ownership checks inside the function remain enforced via auth.uid().
ALTER FUNCTION public.velora_upsert_product_variant(uuid,uuid,text,text,numeric,integer,jsonb)
  SECURITY DEFINER;
ALTER FUNCTION public.velora_retire_product_variant(uuid)
  SECURITY DEFINER;
