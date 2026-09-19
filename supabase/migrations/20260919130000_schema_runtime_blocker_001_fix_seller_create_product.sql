-- SCHEMA_RUNTIME_BLOCKER-001
-- Restore-Test/Sprint staging fix: public.products has no sku column.
-- Keep the existing function signature for caller compatibility; p_sku remains
-- validated and is used only to make the slug unique. No products.sku write occurs.
-- Production remains FROZEN.

create or replace function public.velora_seller_create_product(
  p_name text,
  p_sku text,
  p_price numeric,
  p_stock integer,
  p_category text default null,
  p_brand text default null,
  p_currency text default 'EGP'
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
  v_store uuid;
  v_id uuid;
  v_currency text := upper(trim(coalesce(p_currency,'')));
  v_sku text := nullif(trim(p_sku),'');
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select id into v_seller
  from public.sellers
  where user_id=v_uid and status='approved'
  limit 1;
  if v_seller is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;

  if coalesce(trim(p_name),'')='' or length(trim(p_name))>300
    then raise exception 'INVALID_PRODUCT_NAME'; end if;
  if p_price is null or p_price < 0 or p_price > 999999999
    then raise exception 'INVALID_PRODUCT_PRICE'; end if;
  if p_stock is null or p_stock < 0 or p_stock > 2147483647
    then raise exception 'INVALID_PRODUCT_STOCK'; end if;
  if v_currency='' or not exists(
    select 1
    from public.currencies c
    where c.code=v_currency and c.is_active=true
  ) then raise exception 'INVALID_PRODUCT_CURRENCY'; end if;
  if v_sku is not null and length(v_sku)>120
    then raise exception 'INVALID_PRODUCT_SKU'; end if;

  select id into v_store
  from public.stores
  where owner_id=v_uid and status='approved'
  order by created_at desc
  limit 1;
  if v_store is null then raise exception 'APPROVED_STORE_REQUIRED'; end if;

  insert into public.products(
    seller_id,
    store_id,
    name,
    slug,
    price,
    stock,
    status,
    category,
    brand,
    currency_code
  )
  values(
    v_seller,
    v_store,
    trim(p_name),
    lower(regexp_replace(
      trim(p_name)||'-'||coalesce(v_sku,substr(gen_random_uuid()::text,1,8)),
      '[^a-zA-Z0-9]+','-','g'
    )),
    p_price,
    p_stock,
    'pending',
    nullif(trim(p_category),''),
    nullif(trim(p_brand),''),
    v_currency
  )
  returning id into v_id;

  insert into public.audit_logs(
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values(
    v_uid,
    'seller_product_created',
    'product',
    v_id,
    jsonb_build_object('seller_id',v_seller,'status','pending')
  );

  return v_id;
end;
$function$;

revoke all on function public.velora_seller_create_product(text,text,numeric,integer,text,text,text) from public, anon, authenticated;
grant execute on function public.velora_seller_create_product(text,text,numeric,integer,text,text,text) to authenticated;
grant execute on function public.velora_seller_create_product(text,text,numeric,integer,text,text,text) to service_role;
