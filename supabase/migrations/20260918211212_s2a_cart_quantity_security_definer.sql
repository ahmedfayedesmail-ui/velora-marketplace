-- S2-A hotfix 3: quantity update needs controlled row-lock visibility under RLS.
ALTER FUNCTION public.velora_set_cart_quantity_variant(uuid,uuid,integer)
  SECURITY DEFINER;
