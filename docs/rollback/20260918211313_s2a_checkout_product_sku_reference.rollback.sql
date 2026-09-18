-- Rollback S2-A hotfix 6.
-- Restores the pre-hotfix products.sku reference behavior. This is provided as a reference rollback
-- and should only be used if the schema actually contains a compatible products.sku field.
DO $$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef(
    'public.velora_create_order(jsonb,text,numeric,text,text,text,text,text,text,text)'::regprocedure
  ) INTO v_def;

  IF position('v_sku:=null;' in v_def) = 0 THEN
    RAISE EXCEPTION 'S2A_HOTFIX6_ROLLBACK_EXPECTED_STATE_NOT_FOUND';
  END IF;

  v_def := replace(v_def,
    'v_sku:=null;',
    'v_sku:=v_product.sku;');

  EXECUTE v_def;
END
$$;
