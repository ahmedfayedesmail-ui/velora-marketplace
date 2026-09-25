CREATE OR REPLACE FUNCTION public.velora_update_shipment_status(p_shipment_id uuid, p_status text, p_tracking_number text DEFAULT NULL::text, p_tracking_url text DEFAULT NULL::text, p_carrier_code text DEFAULT NULL::text, p_service_name text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_order_id uuid;
  v_old_status text;
  v_status text := lower(trim(coalesce(p_status,'')));
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if v_status not in (
    'pending','label_created','preparing','shipped','in_transit',
    'delivered','failed','returned','cancelled'
  ) then
    raise exception 'INVALID_SHIPMENT_STATUS';
  end if;

  select sh.order_id, st.owner_id, sh.status
    into v_order_id, v_owner, v_old_status
  from public.shipments sh
  join public.stores st on st.id=sh.store_id
  where sh.id=p_shipment_id
  for update;

  if not found then
    raise exception 'SHIPMENT_NOT_FOUND';
  end if;

  if not (public.velora_is_staff() or v_owner=v_user) then
    raise exception 'FORBIDDEN';
  end if;

  if v_old_status = v_status then
    return jsonb_build_object(
      'ok',true,
      'shipment_id',p_shipment_id,
      'order_id',v_order_id,
      'status',v_status,
      'unchanged',true
    );
  end if;

  if not (
       (v_old_status='pending' and v_status in ('label_created','preparing','shipped','in_transit','failed','cancelled'))
    or (v_old_status='label_created' and v_status in ('preparing','shipped','in_transit','failed','cancelled'))
    or (v_old_status='preparing' and v_status in ('shipped','in_transit','failed','cancelled'))
    or (v_old_status='shipped' and v_status in ('in_transit','delivered','failed','returned'))
    or (v_old_status='in_transit' and v_status in ('delivered','failed','returned'))
    or (v_old_status='delivered' and v_status='returned')
  ) then
    raise exception 'INVALID_SHIPMENT_TRANSITION'
      using detail = format(
        'Transition %s -> %s is not allowed',
        coalesce(v_old_status,'<null>'),
        v_status
      );
  end if;

  update public.shipments
  set status=v_status,
      carrier_code=coalesce(nullif(trim(p_carrier_code),''),carrier_code),
      service_name=coalesce(nullif(trim(p_service_name),''),service_name),
      tracking_number=coalesce(nullif(trim(p_tracking_number),''),tracking_number),
      tracking_url=coalesce(nullif(trim(p_tracking_url),''),tracking_url),
      shipped_at=case
        when v_status in ('shipped','in_transit','delivered')
          then coalesce(shipped_at,now())
        else shipped_at
      end,
      delivered_at=case
        when v_status='delivered'
          then coalesce(delivered_at,now())
        else delivered_at
      end,
      updated_at=now()
  where id=p_shipment_id;

  insert into public.audit_logs(
    actor_id,action,entity_type,entity_id,metadata
  )
  values(
    v_user,
    'shipment_status_updated',
    'shipment',
    p_shipment_id,
    jsonb_build_object(
      'order_id',v_order_id,
      'from',v_old_status,
      'to',v_status,
      'tracking_number',coalesce(p_tracking_number,'')
    )
  );

  return jsonb_build_object(
    'ok',true,
    'shipment_id',p_shipment_id,
    'order_id',v_order_id,
    'status',v_status,
    'unchanged',false
  );
end;
$function$

