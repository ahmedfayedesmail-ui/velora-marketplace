create or replace function public.velora_get_store_detail(
  p_store_id uuid,
  p_country_code text default null,
  p_currency_code text default null
)
returns table(
  store_id uuid,
  store_name text,
  store_slug text,
  store_description text,
  store_logo_url text,
  store_banner_url text,
  store_country_code text,
  store_currency text,
  store_language text,
  product_id uuid,
  product_name text,
  product_slug text,
  product_description text,
  brand text,
  category_name text,
  category_slug text,
  subcategory text,
  price numeric,
  original_price numeric,
  product_currency text,
  stock integer,
  rating numeric,
  review_count integer,
  badge text,
  emoji text,
  images jsonb,
  display_currency text,
  display_price numeric,
  fx_rate numeric
)
language sql
security invoker
set search_path to public
stable
as $function$
  select
    s.id,
    s.name,
    s.slug,
    s.description,
    s.logo_url,
    s.banner_url,
    s.country_code,
    s.currency_code,
    s.language_code,
    p.id,
    p.name,
    p.slug,
    p.description,
    p.brand,
    c.name,
    c.slug,
    p.subcategory,
    p.price,
    p.original_price,
    p.currency_code,
    p.stock,
    p.rating,
    p.review_count,
    p.badge,
    p.emoji,
    p.images,
    coalesce(upper(nullif(trim(p_currency_code),'')), p.currency_code),
    round(
      p.price * public.velora_get_fx_rate(
        p.currency_code,
        coalesce(upper(nullif(trim(p_currency_code),'')), p.currency_code)
      ),
      4
    ),
    public.velora_get_fx_rate(
      p.currency_code,
      coalesce(upper(nullif(trim(p_currency_code),'')), p.currency_code)
    )
  from public.stores s
  left join public.products p
    on p.store_id=s.id
   and p.status='approved'::public.product_status
   and p.stock >= 0
  left join public.categories c on c.id=p.category_id
  where s.id=p_store_id
    and s.status='approved'
    and (
      p_country_code is null
      or upper(s.country_code)=upper(p_country_code)
      or p_country_code='*'
    )
    and (
      p_currency_code is null
      or exists (
        select 1
        from public.currencies cur
        where cur.code=upper(nullif(trim(p_currency_code),''))
          and cur.is_active
          and cur.is_checkout_supported
      )
    )
  order by p.rating desc nulls last, p.review_count desc nulls last, p.name;
$function$;

revoke all on function public.velora_get_store_detail(uuid,text,text) from public;
grant execute on function public.velora_get_store_detail(uuid,text,text) to anon, authenticated;
