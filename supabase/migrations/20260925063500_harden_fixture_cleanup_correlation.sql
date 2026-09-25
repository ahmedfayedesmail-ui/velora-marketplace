CREATE OR REPLACE FUNCTION public.velora_test_delete_fixture(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(auth.role(),'') <> 'service_role' THEN
    RAISE EXCEPTION 'service_role_required';
  END IF;

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id_required';
  END IF;

  DELETE FROM public.provider_webhook_events e
  WHERE e.provider_code='paymob'
    AND e.event_id IN (
      SELECT 'paymob_tx_' || coalesce(e2.payload->'obj'->>'id','')
      FROM public.provider_webhook_events e2
      WHERE e2.provider_code='paymob'
        AND e2.payload->'obj'->'order'->>'id' IN (
          SELECT pa.metadata->>'paymob_order_id'
          FROM public.payment_attempts pa
          WHERE pa.order_id=p_order_id
        )
    );

  DELETE FROM public.audit_logs WHERE entity_id=p_order_id;
  DELETE FROM public.order_status_history WHERE order_id=p_order_id;
  DELETE FROM public.payment_attempts WHERE order_id=p_order_id;
  DELETE FROM public.orders WHERE id=p_order_id;
END;
$function$;
