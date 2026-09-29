-- Velora Restore-Test only.
-- Seller-controlled shipment/proof URLs must be navigable web URLs.
-- Prevent javascript:, data:, and other executable schemes from reaching
-- customer-facing hrefs. No schema change.

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

  if p_tracking_url is not null then
    if length(trim(p_tracking_url))>2048
       or trim(p_tracking_url) !~* '^https?://'
    then
      raise exception 'INVALID_TRACKING_URL';
    end if;
  end if;

  if p_tracking_number is not null and length(trim(p_tracking_number))>160 then
    raise exception 'INVALID_TRACKING_NUMBER';
  end if;

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


create or replace function public.velora_update_shipment_status(
  p_shipment_id uuid,
  p_status text,
  p_tracking_number text default null,
  p_tracking_url text default null,
  p_carrier_code text default null,
  p_service_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_owner uuid;
  v_order_id uuid;
  v_old_status text;
  v_status text := lower(trim(coalesce(p_status,'')));
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  if v_status not in (
    'pending','label_created','preparing','shipped','in_transit',
    'delivered','failed','returned','cancelled'
  ) then
    raise exception 'INVALID_SHIPMENT_STATUS';
  end if;

  select sh.order_id,st.owner_id,sh.status
    into v_order_id,v_owner,v_old_status
  from public.shipments sh
  join public.stores st on st.id=sh.store_id
  where sh.id=p_shipment_id
  for update;

  if not found then raise exception 'SHIPMENT_NOT_FOUND'; end if;
  if not (public.velora_is_staff() or v_owner=v_user) then raise exception 'FORBIDDEN'; end if;

  if v_old_status=v_status then
    return jsonb_build_object(
      'ok',true,'shipment_id',p_shipment_id,'order_id',v_order_id,
      'status',v_status,'unchanged',true
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
      using detail=format(
        'Transition %s -> %s is not allowed',
        coalesce(v_old_status,'<null>'),v_status
      );
  end if;

  if p_tracking_url is not null then
    if length(trim(p_tracking_url))>2048
       or trim(p_tracking_url) !~* '^https?://'
    then
      raise exception 'INVALID_TRACKING_URL';
    end if;
  end if;

  if p_tracking_number is not null and length(trim(p_tracking_number))>160 then
    raise exception 'INVALID_TRACKING_NUMBER';
  end if;

  update public.shipments
  set status=v_status,
      carrier_code=coalesce(nullif(trim(p_carrier_code),''),carrier_code),
      service_name=coalesce(nullif(trim(p_service_name),''),service_name),
      tracking_number=coalesce(nullif(trim(p_tracking_number),''),tracking_number),
      tracking_url=coalesce(nullif(trim(p_tracking_url),''),tracking_url),
      shipped_at=case
        when v_status in ('shipped','in_transit','delivered') then coalesce(shipped_at,now())
        else shipped_at
      end,
      delivered_at=case
        when v_status='delivered' then coalesce(delivered_at,now())
        else delivered_at
      end,
      updated_at=now()
  where id=p_shipment_id;

  insert into public.audit_logs(
    actor_id,action,entity_type,entity_id,metadata
  )
  values(
    v_user,'shipment_status_updated','shipment',p_shipment_id,
    jsonb_build_object(
      'order_id',v_order_id,
      'from',v_old_status,
      'to',v_status,
      'tracking_number',coalesce(p_tracking_number,'')
    )
  );

  return jsonb_build_object(
    'ok',true,'shipment_id',p_shipment_id,'order_id',v_order_id,
    'status',v_status,'unchanged',false
  );
end;
$function$;


create or replace function public.velora_submit_delivery_proof(
  p_shipment_id uuid,
  p_proof_type text,
  p_proof_url text default null,
  p_proof_hash text default null,
  p_latitude numeric default null,
  p_longitude numeric default null,
  p_delivered_to text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid:=auth.uid();
  v_order_id uuid;
  v_store_id uuid;
  v_owner uuid;
  v_status text;
  v_note text;
  v_existing boolean;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_proof_type is null or p_proof_type not in ('photo','signature','otp','gps','carrier_event','other') then
    raise exception 'INVALID_PROOF_TYPE';
  end if;

  if p_proof_url is not null then
    if length(trim(p_proof_url))>2048
       or trim(p_proof_url) !~* '^https?://'
    then
      raise exception 'INVALID_PROOF_URL';
    end if;
  end if;

  if p_proof_hash is not null and length(trim(p_proof_hash))>256 then raise exception 'INVALID_PROOF_HASH'; end if;
  if p_delivered_to is not null and length(trim(p_delivered_to))>200 then raise exception 'INVALID_RECIPIENT'; end if;
  if p_latitude is not null and (p_latitude < -90 or p_latitude > 90) then raise exception 'INVALID_LATITUDE'; end if;
  if p_longitude is not null and (p_longitude < -180 or p_longitude > 180) then raise exception 'INVALID_LONGITUDE'; end if;
  if p_metadata is null then p_metadata := '{}'::jsonb; end if;
  if jsonb_typeof(p_metadata) <> 'object' then raise exception 'INVALID_METADATA'; end if;

  select sh.order_id,sh.store_id,st.owner_id,sh.status
    into v_order_id,v_store_id,v_owner,v_status
  from public.shipments sh
  join public.stores st on st.id=sh.store_id
  where sh.id=p_shipment_id
  for update;

  if not found then raise exception 'SHIPMENT_NOT_FOUND'; end if;
  if not (public.velora_is_staff() or v_owner=v_user) then raise exception 'FORBIDDEN'; end if;
  if v_status in ('delivered','cancelled','returned','failed') then raise exception 'SHIPMENT_STATE_NOT_ELIGIBLE'; end if;

  select exists(
    select 1 from public.delivery_proofs dp
    where dp.order_id=v_order_id
      and dp.store_id=v_store_id
      and dp.delivered_at is not null
  ) into v_existing;

  if v_existing then raise exception 'DELIVERY_PROOF_ALREADY_SUBMITTED'; end if;

  v_note:=jsonb_build_object(
    'proof_type',p_proof_type,
    'proof_hash',nullif(trim(p_proof_hash),''),
    'latitude',p_latitude,
    'longitude',p_longitude,
    'metadata',p_metadata
  )::text;

  if p_delivered_to is not null then
    v_note:='delivered_to='||trim(p_delivered_to)||' | '||v_note;
  end if;

  insert into public.delivery_proofs(
    order_id,order_item_id,store_id,delivered_at,photo_url,recipient_name,notes,created_by
  )
  values(
    v_order_id,null,v_store_id,now(),nullif(trim(p_proof_url),''),
    nullif(trim(p_delivered_to),''),v_note,v_user
  );

  update public.shipments
  set status='delivered',
      delivered_at=coalesce(delivered_at,now()),
      updated_at=now()
  where id=p_shipment_id;

  insert into public.audit_logs(
    actor_id,action,entity_type,entity_id,metadata
  )
  values(
    v_user,'delivery_proof_submitted','shipment',p_shipment_id,
    jsonb_build_object(
      'order_id',v_order_id,
      'store_id',v_store_id,
      'proof_type',p_proof_type
    )
  );

  return jsonb_build_object(
    'ok',true,'shipment_id',p_shipment_id,'order_id',v_order_id,'status','delivered'
  );
end;
$function$;
