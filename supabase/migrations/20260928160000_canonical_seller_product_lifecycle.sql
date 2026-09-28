-- VELORA PRODUCT LIFECYCLE — canonical seller create/update surface
-- Restore-Test only until Preview/Browser evidence exists.
-- Production remains FROZEN.

create or replace function public.velora_seller_create_product_full(
  p_name text,
  p_price numeric,
  p_stock integer,
  p_category text default null,
  p_brand text default null,
  p_currency text default 'EGP',
  p_original_price numeric default null,
  p_subcategory text default null,
  p_description text default null,
  p_emoji text default '📦',
  p_image_url text default null,
  p_tags jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
  v_store uuid;
  v_id uuid;
  v_currency text := upper(trim(coalesce(p_currency,'')));
  v_name text := nullif(trim(p_name),'');
  v_category text := nullif(trim(p_category),'');
  v_brand text := nullif(trim(p_brand),'');
  v_subcategory text := nullif(trim(p_subcategory),'');
  v_description text := nullif(trim(p_description),'');
  v_image_url text := nullif(trim(p_image_url),'');
  v_emoji text := nullif(trim(coalesce(p_emoji,'')),'');
  v_tags jsonb := coalesce(p_tags,'[]'::jsonb);
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select id into v_seller
  from public.sellers
  where user_id=v_uid and status='approved'
  order by created_at desc
  limit 1;
  if v_seller is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;

  perform public.velora_assert_seller_product_capacity(v_seller);

  if v_name is null or length(v_name)<3 or length(v_name)>300 then
    raise exception 'INVALID_PRODUCT_NAME';
  end if;
  if p_price is null or p_price < 0 or p_price > 999999999 then
    raise exception 'INVALID_PRODUCT_PRICE';
  end if;
  if p_stock is null or p_stock < 0 or p_stock > 2147483647 then
    raise exception 'INVALID_PRODUCT_STOCK';
  end if;
  if p_original_price is not null and (p_original_price < 0 or p_original_price > 999999999) then
    raise exception 'INVALID_ORIGINAL_PRICE';
  end if;
  if v_currency='' or not exists(
    select 1 from public.currencies c
    where c.code=v_currency and c.is_active=true
  ) then
    raise exception 'INVALID_PRODUCT_CURRENCY';
  end if;
  if v_subcategory is not null and length(v_subcategory)>120 then
    raise exception 'INVALID_PRODUCT_SUBCATEGORY';
  end if;
  if v_description is null or length(v_description)>10000 then
    raise exception 'INVALID_PRODUCT_DESCRIPTION';
  end if;
  if v_image_url is null or length(v_image_url)>2048
     or v_image_url !~* '^https?://' then
    raise exception 'PRODUCT_IMAGE_URL_REQUIRED';
  end if;
  if v_emoji is not null and length(v_emoji)>16 then
    raise exception 'INVALID_PRODUCT_EMOJI';
  end if;
  if jsonb_typeof(v_tags)<>'array' or jsonb_array_length(v_tags)>50 then
    raise exception 'INVALID_PRODUCT_TAGS';
  end if;

  select id into v_store
  from public.stores
  where owner_id=v_uid and status='approved'
  order by created_at desc
  limit 1;
  if v_store is null then raise exception 'APPROVED_STORE_REQUIRED'; end if;

  insert into public.products(
    seller_id,store_id,name,slug,price,original_price,stock,status,
    category,subcategory,brand,description,emoji,images,tags,currency_code
  )
  values(
    v_seller,
    v_store,
    v_name,
    lower(regexp_replace(
      v_name||'-'||substr(gen_random_uuid()::text,1,8),
      '[^a-zA-Z0-9]+','-','g'
    )),
    p_price,
    nullif(p_original_price,0),
    p_stock,
    'pending'::public.product_status,
    v_category,
    v_subcategory,
    v_brand,
    v_description,
    coalesce(v_emoji,'📦'),
    jsonb_build_array(v_image_url),
    v_tags,
    v_currency
  )
  returning id into v_id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,
    'seller_product_created',
    'product',
    v_id,
    jsonb_build_object(
      'seller_id',v_seller,
      'status','pending',
      'surface','canonical_full_product_v1',
      'plan_name',(public.velora_get_seller_entitlement()->>'plan_name'),
      'max_products',(public.velora_get_seller_entitlement()->>'max_products')
    )
  );

  return v_id;
end;
$function$;

create or replace function public.velora_seller_update_product_full(
  p_product_id uuid,
  p_name text,
  p_price numeric,
  p_stock integer,
  p_category text,
  p_brand text,
  p_subcategory text,
  p_original_price numeric,
  p_description text,
  p_emoji text,
  p_image_url text,
  p_tags jsonb
)
returns boolean
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
  v_name text := nullif(trim(p_name),'');
  v_category text := nullif(trim(p_category),'');
  v_brand text := nullif(trim(p_brand),'');
  v_subcategory text := nullif(trim(p_subcategory),'');
  v_description text := nullif(trim(p_description),'');
  v_image_url text := nullif(trim(p_image_url),'');
  v_emoji text := nullif(trim(coalesce(p_emoji,'')),'');
  v_tags jsonb := coalesce(p_tags,'[]'::jsonb);
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select id into v_seller
  from public.sellers
  where user_id=v_uid and status='approved'
  order by created_at desc
  limit 1;
  if v_seller is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;

  if not exists(
    select 1 from public.products
    where id=p_product_id and seller_id=v_seller
  ) then
    raise exception 'PRODUCT_NOT_OWNED';
  end if;

  if v_name is null or length(v_name)<3 or length(v_name)>300 then
    raise exception 'INVALID_PRODUCT_NAME';
  end if;
  if p_price is null or p_price < 0 or p_price > 999999999 then
    raise exception 'INVALID_PRODUCT_PRICE';
  end if;
  if p_stock is null or p_stock < 0 or p_stock > 2147483647 then
    raise exception 'INVALID_PRODUCT_STOCK';
  end if;
  if p_original_price is not null and (p_original_price < 0 or p_original_price > 999999999) then
    raise exception 'INVALID_ORIGINAL_PRICE';
  end if;
  if v_subcategory is not null and length(v_subcategory)>120 then
    raise exception 'INVALID_PRODUCT_SUBCATEGORY';
  end if;
  if v_description is null or length(v_description)>10000 then
    raise exception 'INVALID_PRODUCT_DESCRIPTION';
  end if;
  if v_image_url is null or length(v_image_url)>2048
     or v_image_url !~* '^https?://' then
    raise exception 'PRODUCT_IMAGE_URL_REQUIRED';
  end if;
  if v_emoji is not null and length(v_emoji)>16 then
    raise exception 'INVALID_PRODUCT_EMOJI';
  end if;
  if jsonb_typeof(v_tags)<>'array' or jsonb_array_length(v_tags)>50 then
    raise exception 'INVALID_PRODUCT_TAGS';
  end if;

  update public.products
  set
    name=v_name,
    price=p_price,
    stock=p_stock,
    category=v_category,
    brand=v_brand,
    subcategory=v_subcategory,
    original_price=nullif(p_original_price,0),
    description=v_description,
    emoji=coalesce(v_emoji,'📦'),
    images=jsonb_build_array(v_image_url),
    tags=v_tags,
    updated_at=now()
  where id=p_product_id and seller_id=v_seller;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,
    'seller_product_updated',
    'product',
    p_product_id,
    jsonb_build_object('seller_id',v_seller,'surface','canonical_full_product_v1')
  );

  return true;
end;
$function$;

revoke all on function public.velora_seller_create_product_full(text,numeric,integer,text,text,text,numeric,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.velora_seller_create_product_full(text,numeric,integer,text,text,text,numeric,text,text,text,text,jsonb) to authenticated,service_role;

revoke all on function public.velora_seller_update_product_full(uuid,text,numeric,integer,text,text,text,numeric,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.velora_seller_update_product_full(uuid,text,numeric,integer,text,text,text,numeric,text,text,text,jsonb) to authenticated,service_role;
