-- Velora: suppress seller ads for products with no sellable inventory.
-- No campaign state or financial state is changed here; this is a storefront-read guard.
CREATE OR REPLACE FUNCTION public.velora_get_active_seller_ads(
  p_placement text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_limit integer DEFAULT 8
)
RETURNS TABLE(
  campaign_id uuid,
  product_id uuid,
  product_name text,
  brand text,
  category text,
  price numeric,
  currency_code text,
  emoji text,
  images jsonb,
  store_id uuid,
  store_name text,
  package_code text,
  package_name text,
  placement text,
  starts_at timestamptz,
  ends_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select
    c.id,
    p.id,
    p.name,
    p.brand,
    p.category,
    p.price,
    coalesce(nullif(upper(p.currency_code),''),c.currency_code),
    p.emoji,
    p.images,
    st.id,
    st.name,
    ap.code,
    ap.name,
    ap.placement,
    c.starts_at,
    c.ends_at
  from public.seller_ad_campaigns c
  join public.products p on p.id=c.product_id
  join public.stores st on st.id=c.store_id
  join public.sellers s on s.id=c.seller_id
  join public.seller_ad_packages ap on ap.id=c.ad_package_id
  where c.status='active'
    and c.starts_at is not null
    and c.starts_at<=now()
    and c.ends_at is not null
    and c.ends_at>now()
    and p.status='approved'
    and st.status='approved'
    and s.status='approved'
    and ap.is_active=true
    and (
      coalesce(p.stock,0) > 0
      or exists (
        select 1
        from public.product_variants pv
        where pv.product_id=p.id
          and pv.is_active=true
          and coalesce(pv.stock_quantity,0) > 0
      )
    )
    and (p_placement is null or ap.placement=lower(trim(p_placement)))
    and (
      p_category is null
      or lower(coalesce(p.category,''))=lower(trim(p_category))
      or lower(ap.placement)='home_spotlight'
    )
  order by ap.sort_order asc,c.created_at asc,c.id asc
  limit greatest(least(coalesce(p_limit,8),24),1);
$function$;
