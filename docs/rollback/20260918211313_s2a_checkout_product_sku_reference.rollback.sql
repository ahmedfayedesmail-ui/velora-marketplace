-- Rollback S2-A hotfix 6.
-- Guarded: this rollback is valid only when public.products.sku exists.
DO $$
DECLARE
  v_def text;
  v_has_sku boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='products'
      AND column_name='sku'
  ) INTO v_has_sku;

  IF NOT v_has_sku THEN
    RAISE EXCEPTION 'S2A_HOTFIX6_ROLLBACK_BLOCKED_PRODUCTS_SKU_COLUMN_MISSING';
  END IF;

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
