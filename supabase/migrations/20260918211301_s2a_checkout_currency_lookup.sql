-- S2-A hotfix 5: idempotency lookup must not overwrite the requested currency with NULL.
DO $$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef(
    'public.velora_create_order(jsonb,text,numeric,text,text,text,text,text,text,text)'::regprocedure
  ) INTO v_def;

  IF position('returning id,order_number into v_order_id,v_order_number;' in v_def) = 0 THEN
    RAISE EXCEPTION 'S2A_HOTFIX5_EXPECTED_HOTFIX4_STATE_NOT_FOUND';
  END IF;

  v_def := replace(v_def,
    'v_order_number bigint;
',
    'v_order_number bigint;
  v_existing_currency text;
');
  v_def := replace(v_def,
    'into v_order_id,v_order_number,v_total,p_currency',
    'into v_order_id,v_order_number,v_total,v_existing_currency');
  v_def := replace(v_def,
    '''total'',v_total,''currency'',p_currency);',
    '''total'',v_total,''currency'',v_existing_currency);');

  EXECUTE v_def;
END
$$;
