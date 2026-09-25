CREATE OR REPLACE FUNCTION public.velora_set_seller_order_status(
  p_order_id uuid,
  p_status text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_old public.order_status;
  v_new text := lower(trim(p_status));
  v_seller uuid;
  v_item_count integer;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if v_new not in ('confirmed','processing') then
    raise exception 'INVALID_SELLER_STATUS';
  end if;

  select id into v_seller
  from public.sellers
  where user_id = v_uid
    and status = 'approved'
  limit 1;

  if v_seller is null then
    raise exception 'APPROVED_SELLER_ACCOUNT_REQUIRED';
  end if;

  select count(*) into v_item_count
  from public.order_items
  where order_id = p_order_id;

  if v_item_count = 0 then
    raise exception 'ORDER_HAS_NO_ITEMS';
  end if;

  if exists (
    select 1
    from public.order_items oi
    where oi.order_id = p_order_id
      and oi.seller_id is distinct from v_seller
  ) then
    raise exception 'MULTI_SELLER_ORDER_GLOBAL_STATUS_FORBIDDEN';
  end if;

  select status into v_old
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_old in ('delivered','cancelled','refunded') then raise exception 'INVALID_TRANSITION'; end if;
  if v_old = 'pending' and v_new <> 'confirmed' then raise exception 'INVALID_TRANSITION'; end if;
  if v_old = 'confirmed' and v_new <> 'processing' then raise exception 'INVALID_TRANSITION'; end if;
  if v_old = 'processing' and v_new <> 'processing' then raise exception 'INVALID_TRANSITION'; end if;
  if v_old = v_new then
    return jsonb_build_object('ok',true,'order_id',p_order_id,'status',v_new,'unchanged',true);
  end if;

  update public.orders
  set status=v_new::order_status, updated_at=now()
  where id=p_order_id;

  insert into public.order_status_history(order_id,order_item_id,from_status,to_status,changed_by,note)
  values(p_order_id,null,v_old::text,v_new,v_uid,p_note);

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,'seller_order_status_changed','order',p_order_id,
         jsonb_build_object('from',v_old::text,'to',v_new,'note',p_note,'global_status_scope','single_seller_order'));

  return jsonb_build_object('ok',true,'order_id',p_order_id,'status',v_new);
end;
$function$;

CREATE OR REPLACE FUNCTION public.velora_seller_update_order_status(
  p_order_id uuid,
  p_status public.order_status
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
begin
  select id into v_seller
  from public.sellers
  where user_id=v_uid and status='approved'
  limit 1;

  if v_seller is null then raise exception 'APPROVED_SELLER_ACCOUNT_REQUIRED'; end if;

  if not exists(
    select 1 from public.order_items
    where order_id=p_order_id and seller_id=v_seller
  ) then
    raise exception 'ORDER_NOT_ASSIGNED_TO_SELLER';
  end if;

  return public.velora_set_seller_order_status(p_order_id,p_status::text) is not null;
end;
$function$;
