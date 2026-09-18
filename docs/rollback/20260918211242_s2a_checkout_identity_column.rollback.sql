-- Rollback S2-A hotfix 4.
-- Guarded: the current schema has orders.order_number GENERATED ALWAYS.
-- Reverting the function while that identity semantics remain would reintroduce a runtime failure,
-- so this artifact refuses to run until the schema is compatible.
DO $$
DECLARE
  v_is_identity text;
  v_def text;
BEGIN
  SELECT is_identity INTO v_is_identity
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='orders' AND column_name='order_number';

  IF v_is_identity = 'YES' THEN
    RAISE EXCEPTION 'S2A_HOTFIX4_ROLLBACK_BLOCKED_IDENTITY_COLUMN';
  END IF;

  SELECT pg_get_functiondef(
    'public.velora_create_order(jsonb,text,numeric,text,text,text,text,text,text,text)'::regprocedure
  ) INTO v_def;

  v_def := replace(v_def,
    '  v_existing_currency text;
',
    '');
  v_def := replace(v_def,
    'begin
  if v_customer',
    'begin
  v_order_number:=nextval(''public.velora_order_number_seq'');
  if v_customer');
  v_def := replace(v_def,
    'insert into public.orders(
    customer_id,',
    'insert into public.orders(
    order_number,customer_id,');
  v_def := replace(v_def,
    'values(
    v_customer,',
    'values(
    v_order_number,v_customer,');
  v_def := replace(v_def,
    'returning id,order_number into v_order_id,v_order_number;',
    'returning id into v_order_id;');

  EXECUTE v_def;
END
$$;
