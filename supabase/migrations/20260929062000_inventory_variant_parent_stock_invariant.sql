-- Velora Inventory / Variant Aggregate Stock Invariant
-- Restore-Test first. Production remains FROZEN.
--
-- Existing canonical model:
--   products.stock = aggregate marketplace stock
--   product_variants.stock_quantity = variant-level stock
-- Invariant when active variants exist:
--   products.stock = SUM(active product_variants.stock_quantity)
--
-- No new inventory table or second inventory engine is introduced.
-- Browser callers use the existing canonical RPCs.

CREATE OR REPLACE FUNCTION public.velora_upsert_product_variant(p_product_id uuid, p_variant_id uuid, p_name text, p_sku text, p_price numeric, p_stock_quantity integer, p_attributes jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_seller uuid;
  v_store uuid;
  v_id uuid;
  v_product public.products%rowtype;
  v_total_stock integer;
  v_name text:=nullif(trim(coalesce(p_name,'')),'');
  v_sku text:=nullif(trim(coalesce(p_sku,'')),'');
  v_attrs jsonb:=coalesce(p_attributes,'{}'::jsonb);
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select s.id,st.id into v_seller,v_store
  from public.sellers s
  left join public.stores st on st.owner_id=s.user_id and st.status='approved'
  where s.user_id=v_uid and s.status='approved'
  order by st.created_at desc nulls last limit 1;
  if v_seller is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;
  if v_store is null then raise exception 'APPROVED_STORE_REQUIRED'; end if;
  select p.* into v_product
  from public.products p
  where p.id=p_product_id
    and p.seller_id=v_seller
    and p.store_id=v_store
  for update;
  if not found then raise exception 'PRODUCT_NOT_OWNED'; end if;
  if v_name is null or length(v_name)>300 then raise exception 'INVALID_VARIANT_NAME'; end if;
  if v_sku is null or length(v_sku)>120 then raise exception 'INVALID_VARIANT_SKU'; end if;
  if p_price is not null and (p_price<0 or p_price>999999999) then raise exception 'INVALID_VARIANT_PRICE'; end if;
  if p_stock_quantity is null or p_stock_quantity<0 or p_stock_quantity>2147483647 then raise exception 'INVALID_VARIANT_STOCK'; end if;
  if jsonb_typeof(v_attrs)<>'object' then raise exception 'INVALID_VARIANT_ATTRIBUTES'; end if;

  if p_variant_id is null then
    insert into public.product_variants(product_id,name,sku,price,stock_quantity,attributes,is_active,updated_at)
    values(p_product_id,v_name,v_sku,p_price,p_stock_quantity,v_attrs,true,now())
    returning id into v_id;
  else
    if not exists(select 1 from public.product_variants where id=p_variant_id and product_id=p_product_id) then
      raise exception 'VARIANT_NOT_FOUND_OR_NOT_OWNED';
    end if;
    update public.product_variants
      set name=v_name,sku=v_sku,price=p_price,stock_quantity=p_stock_quantity,
          attributes=v_attrs,is_active=true,updated_at=now()
    where id=p_variant_id
    returning id into v_id;
  end if;

  select coalesce(sum(stock_quantity),0)::integer into v_total_stock
  from public.product_variants
  where product_id=p_product_id
    and is_active=true;

  update public.products
  set stock=v_total_stock,
      updated_at=now()
  where id=p_product_id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,
         case when p_variant_id is null then 'seller_product_variant_created' else 'seller_product_variant_updated' end,
         'product_variant',v_id,
         jsonb_build_object('product_id',p_product_id,'seller_id',v_seller,'sku',v_sku,'active_variant_stock_total',v_total_stock));
  return v_id;
exception
  when unique_violation then raise exception 'VARIANT_SKU_ALREADY_EXISTS';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.velora_retire_product_variant(p_variant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_product uuid;
  v_total_stock integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select p.id into v_product
  from public.product_variants v
  join public.products p on p.id=v.product_id
  join public.sellers s on s.id=p.seller_id
  where v.id=p_variant_id and s.user_id=v_uid and s.status='approved'
  for update of p;
  if v_product is null then raise exception 'VARIANT_NOT_FOUND_OR_NOT_OWNED'; end if;
  update public.product_variants set is_active=false,updated_at=now() where id=p_variant_id;

  select coalesce(sum(stock_quantity),0)::integer into v_total_stock
  from public.product_variants
  where product_id=v_product
    and is_active=true;

  update public.products
  set stock=v_total_stock,
      updated_at=now()
  where id=v_product;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,'seller_product_variant_retired','product_variant',p_variant_id,jsonb_build_object('product_id',v_product,'active_variant_stock_total',v_total_stock));
  return jsonb_build_object('ok',true,'variant_id',p_variant_id,'product_id',v_product,'is_active',false);
end;
$function$
;

CREATE OR REPLACE FUNCTION public.velora_seller_update_product(p_product_id uuid, p_price numeric DEFAULT NULL::numeric, p_stock integer DEFAULT NULL::integer, p_category text DEFAULT NULL::text, p_brand text DEFAULT NULL::text, p_name text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
  v_product public.products%rowtype;
  v_new_name text;
  v_new_category text;
  v_new_brand text;
  v_material_change boolean := false;
  v_new_status text;
  v_has_active_variants boolean := false;
  v_active_variant_stock integer := 0;
  v_effective_stock integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select id into v_seller
  from public.sellers
  where user_id=v_uid and status='approved'
  order by created_at desc
  limit 1;

  if v_seller is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;

  select p.* into v_product
  from public.products p
  where p.id=p_product_id
    and p.seller_id=v_seller
  for update;

  if not found then raise exception 'PRODUCT_NOT_OWNED'; end if;

  if p_price is not null and (p_price < 0 or p_price > 999999999) then
    raise exception 'INVALID_PRODUCT_PRICE';
  end if;
  if p_stock is not null and (p_stock < 0) then
    raise exception 'INVALID_PRODUCT_STOCK';
  end if;
  if p_name is not null and (nullif(trim(p_name),'') is null or length(trim(p_name))>300) then
    raise exception 'INVALID_PRODUCT_NAME';
  end if;

  v_new_name := coalesce(nullif(trim(p_name),''),v_product.name);
  v_new_category := coalesce(nullif(trim(p_category),''),v_product.category);
  v_new_brand := coalesce(nullif(trim(p_brand),''),v_product.brand);

  v_material_change :=
       v_new_name is distinct from v_product.name
    or v_new_category is distinct from v_product.category
    or v_new_brand is distinct from v_product.brand;

  select exists(select 1 from public.product_variants where product_id=p_product_id and is_active=true),
         coalesce(sum(stock_quantity),0)::integer
    into v_has_active_variants,v_active_variant_stock
  from public.product_variants
  where product_id=p_product_id and is_active=true;

  v_effective_stock := case
    when v_has_active_variants then v_active_variant_stock
    else coalesce(p_stock,v_product.stock)
  end;

  v_new_status := v_product.status::text;
  if v_material_change and v_product.status::text in ('approved','rejected') then
    v_new_status := 'pending';
  end if;

  update public.products
  set name=v_new_name,
      price=coalesce(p_price,price),
      stock=v_effective_stock,
      category=v_new_category,
      brand=v_new_brand,
      status=v_new_status::public.product_status,
      updated_at=now()
  where id=v_product.id
    and seller_id=v_seller;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,
    case when v_new_status='pending' and v_product.status::text<>v_new_status
         then 'seller_product_re_review_required'
         else 'seller_product_updated'
    end,
    'product',
    p_product_id,
    jsonb_build_object(
      'seller_id',v_seller,
      'previous_status',v_product.status::text,
      'new_status',v_new_status,
      'material_change',v_material_change,
      'changed_fields',jsonb_build_object(
        'name',v_new_name is distinct from v_product.name,
        'category',v_new_category is distinct from v_product.category,
        'brand',v_new_brand is distinct from v_product.brand,
        'price',p_price is not null and p_price is distinct from v_product.price,
        'stock',p_stock is not null and p_stock is distinct from v_product.stock
      ),
      'policy','price_and_stock_preserve_lifecycle; content_fields_require_review',
      'effective_stock',v_effective_stock,
      'active_variant_stock_total',case when v_has_active_variants then v_active_variant_stock else null end,
      'stock_input_overridden_by_variants',v_has_active_variants and p_stock is not null
    )
  );

  return true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.velora_seller_update_product_full(p_product_id uuid, p_name text, p_price numeric, p_stock integer, p_category text, p_brand text, p_subcategory text, p_original_price numeric, p_description text, p_emoji text, p_image_url text, p_tags jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
  v_product public.products%rowtype;
  v_name text := nullif(trim(p_name),'');
  v_category text := nullif(trim(p_category),'');
  v_brand text := nullif(trim(p_brand),'');
  v_subcategory text := nullif(trim(p_subcategory),'');
  v_description text := nullif(trim(p_description),'');
  v_image_url text := nullif(trim(p_image_url),'');
  v_emoji text := nullif(trim(coalesce(p_emoji,'')),'');
  v_tags jsonb := coalesce(p_tags,'[]'::jsonb);
  v_material_change boolean := false;
  v_new_status text;
  v_has_active_variants boolean := false;
  v_active_variant_stock integer := 0;
  v_effective_stock integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  select id into v_seller
  from public.sellers
  where user_id=v_uid and status='approved'
  order by created_at desc
  limit 1;

  if v_seller is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;

  select p.* into v_product
  from public.products p
  where p.id=p_product_id
    and p.seller_id=v_seller
  for update;

  if not found then raise exception 'PRODUCT_NOT_OWNED'; end if;

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
  if v_image_url is not null and (length(v_image_url)>2048 or v_image_url !~* '^https?://') then
    raise exception 'INVALID_PRODUCT_IMAGE_URL';
  end if;
  if v_emoji is not null and length(v_emoji)>16 then
    raise exception 'INVALID_PRODUCT_EMOJI';
  end if;
  if jsonb_typeof(v_tags)<>'array' or jsonb_array_length(v_tags)>50 then
    raise exception 'INVALID_PRODUCT_TAGS';
  end if;

  v_material_change :=
       v_name is distinct from v_product.name
    or v_category is distinct from v_product.category
    or v_brand is distinct from v_product.brand
    or v_subcategory is distinct from v_product.subcategory
    or nullif(p_original_price,0) is distinct from v_product.original_price
    or v_description is distinct from v_product.description
    or (v_image_url is not null and v_image_url is distinct from coalesce(v_product.images->>0,''))
    or coalesce(v_emoji,'📦') is distinct from coalesce(v_product.emoji,'📦')
    or v_tags is distinct from coalesce(v_product.tags,'[]'::jsonb);

  select exists(select 1 from public.product_variants where product_id=p_product_id and is_active=true),
         coalesce(sum(stock_quantity),0)::integer
    into v_has_active_variants,v_active_variant_stock
  from public.product_variants
  where product_id=p_product_id and is_active=true;

  v_effective_stock := case
    when v_has_active_variants then v_active_variant_stock
    else coalesce(p_stock,v_product.stock)
  end;

  v_new_status := v_product.status::text;
  if v_material_change and v_product.status::text in ('approved','rejected') then
    v_new_status := 'pending';
  end if;

  update public.products
  set name=v_name,
      price=p_price,
      stock=v_effective_stock,
      category=v_category,
      brand=v_brand,
      subcategory=v_subcategory,
      original_price=nullif(p_original_price,0),
      description=v_description,
      emoji=coalesce(v_emoji,'📦'),
      images=case
        when v_image_url is null then images
        else jsonb_build_array(v_image_url)
      end,
      tags=v_tags,
      status=v_new_status::public.product_status,
      updated_at=now()
  where id=v_product.id
    and seller_id=v_seller;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,
    case when v_new_status='pending' and v_product.status::text<>v_new_status
         then 'seller_product_re_review_required'
         else 'seller_product_updated'
    end,
    'product',
    p_product_id,
    jsonb_build_object(
      'seller_id',v_seller,
      'previous_status',v_product.status::text,
      'new_status',v_new_status,
      'material_change',v_material_change,
      'policy','price_and_stock_preserve_lifecycle; content_fields_require_review',
      'effective_stock',v_effective_stock,
      'active_variant_stock_total',case when v_has_active_variants then v_active_variant_stock else null end,
      'stock_input_overridden_by_variants',v_has_active_variants and p_stock is not null
    )
  );

  return true;
end;
$function$
;
