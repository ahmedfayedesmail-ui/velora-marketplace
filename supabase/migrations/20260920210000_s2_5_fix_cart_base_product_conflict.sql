-- Velora Sprint 2.5
-- Fix base-product cart upsert conflict inference without collapsing variant rows.
--
-- Base cart items are represented by product_variant_id IS NULL.
-- Variant cart items remain distinct under the existing 3-column unique index.

create unique index if not exists cart_items_cart_id_product_id_no_variant_key
  on public.cart_items (cart_id, product_id)
  where product_variant_id is null;

create or replace function public.velora_upsert_cart_item(
  p_product_id uuid,
  p_quantity integer,
  p_currency text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_cart uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'INVALID_QUANTITY'; end if;

  if not exists(
    select 1
    from public.products p
    where p.id = p_product_id
      and p.status::text = 'approved'
  ) then
    raise exception 'PRODUCT_NOT_AVAILABLE';
  end if;

  insert into public.carts(customer_id,currency_code)
  values(v_uid,nullif(upper(p_currency),''))
  on conflict(customer_id)
  do update set
    currency_code=coalesce(excluded.currency_code,public.carts.currency_code),
    updated_at=now()
  returning id into v_cart;

  insert into public.cart_items(cart_id,product_id,quantity)
  values(v_cart,p_product_id,p_quantity)
  on conflict (cart_id, product_id)
    where product_variant_id is null
  do update set
    quantity=public.cart_items.quantity + excluded.quantity,
    updated_at=now();

  update public.carts set updated_at=now() where id=v_cart;

  return jsonb_build_object('ok',true,'cart_id',v_cart);
end;
$function$;
