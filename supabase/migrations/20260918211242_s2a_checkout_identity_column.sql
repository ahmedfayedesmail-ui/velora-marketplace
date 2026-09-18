-- S2-A hotfix 4: orders.order_number is GENERATED ALWAYS.
-- Remove the explicit sequence insert and read the generated identity via RETURNING.
DO $$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef(
    'public.velora_create_order(jsonb,text,numeric,text,text,text,text,text,text,text)'::regprocedure
  ) INTO v_def;

  IF position('order_number,customer_id' in v_def) = 0 THEN
    RAISE EXCEPTION 'S2A_HOTFIX4_EXPECTED_PRE_FIX_ORDER_INSERT_NOT_FOUND';
  END IF;

  v_def := replace(v_def,
    'v_order_number:=nextval(''public.velora_order_number_seq'');',
    '');
  v_def := replace(v_def,
    'insert into public.orders(
    order_number,customer_id,',
    'insert into public.orders(
    customer_id,');
  v_def := replace(v_def,
    'values(
    v_order_number,v_customer,',
    'values(
    v_customer,');
  v_def := replace(v_def,
    'returning id into v_order_id;',
    'returning id,order_number into v_order_id,v_order_number;');

  EXECUTE v_def;
END
$$;
