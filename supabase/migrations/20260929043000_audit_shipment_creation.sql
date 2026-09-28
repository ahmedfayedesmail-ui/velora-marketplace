-- Restore-Test only.
-- Record shipment creation in the existing audit trail. Shipment status changes
-- already use the existing notification trigger; this fills the creation gap.

create or replace function public.velora_create_shipment(
  p_order_id uuid,
  p_order_item_ids uuid[],
  p_carrier_code text default null,
  p_service_name text default null,
  p_tracking_number text default null,
  p_tracking_url text default null,
  p_estimated_delivery_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_store uuid;
  v_ship uuid;
  v_store_count integer;
  v_item_count integer;
  v_expected_item_count integer := cardinality(p_order_item_ids);
  v_order_status text;
  v_payment_status text;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_order_item_ids is null or cardinality(p_order_item_ids)=0 then raise exception 'EMPTY_SHIPMENT'; end if;

  select o.status::text,o.payment_status::text
    into v_order_status,v_payment_status
  from public.orders o
  where o.id=p_order_id
  for update;

  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order_status in ('cancelled','refunded') then raise exception 'ORDER_NOT_SHIPPABLE'; end if;
  if v_payment_status not in ('paid','authorized') then raise exception 'PAYMENT_NOT_SETTLED'; end if;

  select
    (array_agg(oi.store_id order by oi.store_id))[1],
    count(distinct oi.store_id)::integer,
    count(*)::integer
  into v_store,v_store_count,v_item_count
  from public.order_items oi
  where oi.id=any(p_order_item_ids)
    and oi.order_id=p_order_id;

  if v_item_count<>v_expected_item_count
     or v_store_count<>1
     or v_store is null then
    raise exception 'INVALID_SHIPMENT_ITEMS';
  end if;

  if not (
    public.velora_is_staff()
    or exists(
      select 1 from public.stores s
      where s.id=v_store and s.owner_id=v_user
    )
  ) then
    raise exception 'FORBIDDEN';
  end if;

  if exists(
    select 1
    from public.shipment_items si
    join public.shipments sh on sh.id=si.shipment_id
    where si.order_item_id=any(p_order_item_ids)
      and sh.status not in ('cancelled','failed','returned')
  ) then
    raise exception 'ITEM_ALREADY_SHIPPED';
  end if;

  if p_tracking_url is not null and length(trim(p_tracking_url))>2048 then raise exception 'INVALID_TRACKING_URL'; end if;
  if p_tracking_number is not null and length(trim(p_tracking_number))>160 then raise exception 'INVALID_TRACKING_NUMBER'; end if;

  insert into public.shipments(
    order_id,store_id,carrier_code,service_name,tracking_number,tracking_url,
    status,shipped_at,estimated_delivery_at,updated_at
  )
  values(
    p_order_id,
    v_store,
    nullif(trim(p_carrier_code),''),
    nullif(trim(p_service_name),''),
    nullif(trim(p_tracking_number),''),
    nullif(trim(p_tracking_url),''),
    'in_transit',
    now(),
    p_estimated_delivery_at,
    now()
  )
  returning id into v_ship;

  insert into public.shipment_items(shipment_id,order_item_id,quantity)
  select v_ship,oi.id,oi.quantity
  from public.order_items oi
  where oi.id=any(p_order_item_ids)
    and oi.order_id=p_order_id;

  insert into public.audit_logs(
    actor_id,action,entity_type,entity_id,metadata
  )
  values(
    v_user,
    'shipment_created',
    'shipment',
    v_ship,
    jsonb_build_object(
      'order_id',p_order_id,
      'store_id',v_store,
      'item_count',v_item_count,
      'carrier_code',nullif(trim(p_carrier_code),''),
      'service_name',nullif(trim(p_service_name),''),
      'tracking_number',nullif(trim(p_tracking_number),''),
      'actor_role',case when public.velora_is_staff() then 'staff' else 'seller' end
    )
  );

  return jsonb_build_object(
    'ok',true,
    'shipment_id',v_ship,
    'order_id',p_order_id,
    'store_id',v_store,
    'item_count',v_item_count
  );
end;
$function$;
