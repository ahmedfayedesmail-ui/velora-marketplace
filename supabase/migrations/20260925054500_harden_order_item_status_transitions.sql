CREATE OR REPLACE FUNCTION public.velora_update_order_item_status(p_order_item_id uuid, p_new_status text, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item record;
  v_user uuid := auth.uid();
  v_old text;
  v_new text := lower(trim(coalesce(p_new_status,'')));
  v_staff boolean := false;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select oi.*, s.owner_id
    into v_item
  from public.order_items oi
  join public.stores s on s.id=oi.store_id
  where oi.id=p_order_item_id
  for update;

  if not found then
    raise exception 'ORDER_ITEM_NOT_FOUND';
  end if;

  v_staff := public.velora_is_staff();

  if not (v_staff or v_item.owner_id=v_user) then
    raise exception 'FORBIDDEN';
  end if;

  if v_new not in (
    'pending','confirmed','processing','shipped',
    'delivered','cancelled','refunded','disputed'
  ) then
    raise exception 'INVALID_STATUS';
  end if;

  v_old := v_item.status::text;

  if v_old = v_new then
    return jsonb_build_object(
      'ok',true,
      'order_item_id',p_order_item_id,
      'previous_status',v_old,
      'status',v_new,
      'unchanged',true
    );
  end if;

  if not (
       (v_old='pending' and v_new in ('confirmed','cancelled'))
    or (v_old='confirmed' and v_new in ('processing','cancelled'))
    or (v_old='processing' and v_new in ('shipped','cancelled'))
    or (v_old='shipped' and v_new in ('delivered','cancelled','disputed'))
    or (v_old='delivered' and v_new in ('disputed','refunded'))
    or (v_old='cancelled' and v_new in ('disputed','refunded'))
    or (v_old='disputed' and v_new='refunded')
  ) then
    raise exception 'INVALID_TRANSITION'
      using detail = format(
        'Order item transition %s -> %s is not allowed',
        coalesce(v_old,'<null>'),
        v_new
      );
  end if;

  if v_new='delivered'
     and not exists(
       select 1
       from public.shipment_items si
       join public.shipments sh on sh.id=si.shipment_id
       where si.order_item_id=p_order_item_id
         and sh.status='delivered'
     ) then
    raise exception 'DELIVERY_PROOF_REQUIRED';
  end if;

  update public.order_items
  set status=v_new::order_item_status,
      updated_at=now()
  where id=p_order_item_id;

  insert into public.order_status_history(
    order_id,status,actor_id,source,note
  )
  values(
    v_item.order_id,
    v_new,
    v_user,
    case when v_staff then 'staff_workflow' else 'seller_workflow' end,
    p_note
  );

  return jsonb_build_object(
    'ok',true,
    'order_item_id',p_order_item_id,
    'previous_status',v_old,
    'status',v_new,
    'unchanged',false
  );
end;
$function$

