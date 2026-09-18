-- S2-A hotfix 6: products does not expose a sku field in the current schema.
-- Base-product checkout uses NULL SKU; selected variants still supply authoritative variant SKU.
DO $$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef(
    'public.velora_create_order(jsonb,text,numeric,text,text,text,text,text,text,text)'::regprocedure
  ) INTO v_def;

  IF position('v_sku:=v_product.sku;' in v_def) = 0 THEN
    RAISE EXCEPTION 'S2A_HOTFIX6_EXPECTED_PRE_FIX_SKU_REFERENCE_NOT_FOUND';
  END IF;

  v_def := replace(v_def,
    'v_sku:=v_product.sku;',
    'v_sku:=null;');

  EXECUTE v_def;
END
$$;
