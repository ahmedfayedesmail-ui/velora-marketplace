-- S2-A migration 20260918195034 — cart guard + variant FK lookup indexes
-- Production remains FROZEN.

create index if not exists idx_cart_items_product_variant_id on public.cart_items(product_variant_id);
create index if not exists idx_order_items_product_variant_id on public.order_items(product_variant_id);

CREATE OR REPLACE FUNCTION public.velora_set_cart_quantity_variant(p_product_id uuid, p_product_variant_id uuid, p_quantity integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_stock integer;
  v_active boolean;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_product_variant_id is null then raise exception 'VARIANT_REQUIRED'; end if;
  if p_quantity is null or p_quantity<0 then raise exception 'INVALID_QUANTITY'; end if;

  if p_quantity=0 then
    delete from public.cart_items ci using public.carts c
    where ci.cart_id=c.id and c.customer_id=v_uid
      and ci.product_id=p_product_id and ci.product_variant_id=p_product_variant_id;
  else
    select v.stock_quantity,v.is_active into v_stock,v_active
    from public.product_variants v
    where v.id=p_product_variant_id and v.product_id=p_product_id
    for update;
    if not found or not v_active then raise exception 'VARIANT_NOT_AVAILABLE'; end if;
    if p_quantity>v_stock then raise exception 'INSUFFICIENT_VARIANT_STOCK'; end if;
    update public.cart_items ci set quantity=p_quantity,updated_at=now()
    from public.carts c
    where ci.cart_id=c.id and c.customer_id=v_uid
      and ci.product_id=p_product_id and ci.product_variant_id=p_product_variant_id;
    if not found then raise exception 'CART_ITEM_NOT_FOUND'; end if;
  end if;
  update public.carts c set updated_at=now() where c.customer_id=v_uid;
  return jsonb_build_object('ok',true);
end;
$function$;

revoke all on function public.velora_set_cart_quantity_variant(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.velora_set_cart_quantity_variant(uuid,uuid,integer) to authenticated;
