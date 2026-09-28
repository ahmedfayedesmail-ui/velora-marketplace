-- Velora: seller-controlled reversible product availability lifecycle.
-- Allowed seller transitions: approved <-> inactive. Moderation states remain staff-governed.
CREATE OR REPLACE FUNCTION public.velora_seller_set_product_availability(
  p_product_id uuid,
  p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
  v_product public.products%rowtype;
  v_target text := lower(trim(coalesce(p_status,'')));
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_target not in ('approved','inactive') then
    raise exception 'INVALID_PRODUCT_AVAILABILITY_STATUS';
  end if;

  select s.id into v_seller
  from public.sellers s
  where s.user_id=v_uid and s.status='approved'
  order by s.created_at desc
  limit 1;

  if v_seller is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;

  select p.* into v_product
  from public.products p
  where p.id=p_product_id and p.seller_id=v_seller
  for update;

  if not found then raise exception 'PRODUCT_NOT_OWNED'; end if;

  if v_product.status::text = v_target then
    return jsonb_build_object(
      'ok',true,'changed',false,'product_id',v_product.id,'status',v_product.status::text
    );
  end if;

  if not (
    (v_product.status::text='approved' and v_target='inactive')
    or
    (v_product.status::text='inactive' and v_target='approved')
  ) then
    raise exception 'INVALID_PRODUCT_AVAILABILITY_TRANSITION';
  end if;

  update public.products
  set status=v_target::public.product_status, updated_at=now()
  where id=v_product.id and seller_id=v_seller;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,
    case when v_target='inactive'
      then 'seller_product_deactivated'
      else 'seller_product_reactivated'
    end,
    'product',
    v_product.id,
    jsonb_build_object(
      'seller_id',v_seller,
      'previous_status',v_product.status::text,
      'new_status',v_target
    )
  );

  return jsonb_build_object(
    'ok',true,'changed',true,'product_id',v_product.id,'status',v_target
  );
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.velora_seller_set_product_availability(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.velora_seller_set_product_availability(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.velora_seller_set_product_availability(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION private.velora_notify_product_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_user_id uuid;
  v_kind text;
  v_title text;
  v_body text;
begin
  if new.status is not distinct from old.status then return new; end if;

  if new.status::text='approved' and old.status::text='inactive' then
    v_kind:='product_reactivated';
    v_title:='Product reactivated';
    v_body:='Your product "'||new.name||'" is visible again in the marketplace.';
  elsif new.status::text='approved' then
    v_kind:='product_approved';
    v_title:='Product approved';
    v_body:='Your product "'||new.name||'" has been approved.';
  elsif new.status::text='rejected' then
    v_kind:='product_rejected';
    v_title:='Product rejected';
    v_body:='Your product "'||new.name||'" has been rejected.';
  elsif new.status::text='inactive' then
    v_kind:='product_inactive';
    v_title:='Product deactivated';
    v_body:='Your product "'||new.name||'" is no longer visible in the marketplace.';
  else
    return new;
  end if;

  select s.user_id into v_user_id
  from public.sellers s
  where s.id=new.seller_id;

  if v_user_id is not null then
    begin
      perform private.velora_create_notification(
        v_user_id,v_kind,v_title,v_body,'product',new.id
      );
    exception when others then
      raise warning 'S2-E product notification failed: %', sqlerrm;
    end;
  end if;

  return new;
end;
$function$;
