-- S2-A hotfix 2: cart variant upsert must be SECURITY DEFINER.
-- The function still binds the cart to auth.uid() and validates approved product/variant state.
ALTER FUNCTION public.velora_upsert_cart_item_variant(uuid,uuid,integer,text)
  SECURITY DEFINER;
