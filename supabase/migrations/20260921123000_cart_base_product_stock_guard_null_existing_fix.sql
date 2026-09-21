-- Velora Cart Hardening correction
-- FIND-BE-030 — Base Cart Stock Guard gap
-- Correction: PL/pgSQL SELECT INTO returns NULL when no cart row exists.
-- Normalize missing existing cart quantity to 0 before stock comparison.
-- Restore-Test/local implementation artifact.
-- Production remains FROZEN.

create or replace function public.velora_upsert_cart_item(
  p_product_id uuid,
  p_quantity integer,
  p_currency text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_cart uuid;
  v_existing integer := 0;
  v_stock integer;
  v_status text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY';
  end if;

  select p.stock, p.status::text
    into v_stock, v_status
  from public.products p
  where p.id = p_product_id
  for update;

  if not found or v_status <> 'approved' then
    raise exception 'PRODUCT_NOT_AVAILABLE';
  end if;

  -- Aggregate guarantees one scalar row even when no cart item exists.
  -- COALESCE makes the empty-cart case explicitly equal to zero.
  select coalesce(max(ci.quantity), 0)
    into v_existing
  from public.cart_items ci
  join public.carts c on c.id = ci.cart_id
  where c.customer_id = v_uid
    and ci.product_id = p_product_id
    and ci.product_variant_id is null;

  if v_stock < (v_existing + p_quantity) then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  insert into public.carts(customer_id, currency_code)
  values(v_uid, nullif(upper(trim(coalesce(p_currency, ''))), ''))
  on conflict(customer_id)
  do update set
    currency_code = coalesce(excluded.currency_code, public.carts.currency_code),
    updated_at = now()
  returning id into v_cart;

  insert into public.cart_items(cart_id, product_id, quantity)
  values(v_cart, p_product_id, p_quantity)
  on conflict (cart_id, product_id)
    where product_variant_id is null
  do update set
    quantity = public.cart_items.quantity + excluded.quantity,
    updated_at = now();

  update public.carts
  set updated_at = now()
  where id = v_cart;

  return jsonb_build_object('ok', true, 'cart_id', v_cart);
end;
$function$;

revoke all on function public.velora_upsert_cart_item(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.velora_upsert_cart_item(uuid, integer, text) to authenticated;