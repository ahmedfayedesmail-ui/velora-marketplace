-- S2-A migration 20260918194243 — read-path correction
-- Seller owner/staff can read active variants for pending/approved own products;
-- public callers remain limited to active variants of approved products.
-- Production remains FROZEN.

CREATE OR REPLACE FUNCTION public.velora_get_product_variants(p_product_id uuid)
 RETURNS TABLE(id uuid, product_id uuid, name text, sku text, price numeric, stock_quantity integer, attributes jsonb, is_active boolean)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  select v.id,v.product_id,v.name,v.sku,v.price,v.stock_quantity,v.attributes,v.is_active
  from public.product_variants v
  join public.products p on p.id=v.product_id
  where v.product_id=p_product_id
    and v.is_active=true
    and (
      p.status::text='approved'
      or exists(
        select 1
        from public.sellers s
        where s.id=p.seller_id
          and (s.user_id=auth.uid() or public.velora_is_staff())
      )
    )
  order by v.created_at asc,v.id asc;
$function$


revoke all on function public.velora_get_product_variants(uuid) from public,anon,authenticated;
grant execute on function public.velora_get_product_variants(uuid) to anon,authenticated;
