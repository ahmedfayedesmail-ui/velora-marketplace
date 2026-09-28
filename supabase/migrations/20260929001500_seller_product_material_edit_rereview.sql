-- Velora Restore-Test only.
-- Post-approval seller product edits:
--   non-material offer fields: price / stock -> preserve current lifecycle status
--   material content/compliance fields -> approved/rejected -> pending re-review
-- Existing inactive/pending states are preserved.
-- Staff editing translations does not demote an approved product.

create or replace function public.velora_seller_update_product(
  p_product_id uuid,
  p_price numeric default null,
  p_stock integer default null,
  p_category text default null,
  p_brand text default null,
  p_name text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_seller uuid;
  v_product public.products%rowtype;
  v_new_name text;
  v_new_category text;
  v_new_brand text;
  v_material_change boolean := false;
  v_new_status text;
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

  v_new_status := v_product.status::text;
  if v_material_change and v_product.status::text in ('approved','rejected') then
    v_new_status := 'pending';
  end if;

  update public.products
  set name=v_new_name,
      price=coalesce(p_price,price),
      stock=coalesce(p_stock,stock),
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
      'policy','price_and_stock_preserve_lifecycle; content_fields_require_review'
    )
  );

  return true;
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
set search_path to 'public'
as $function$
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

  v_new_status := v_product.status::text;
  if v_material_change and v_product.status::text in ('approved','rejected') then
    v_new_status := 'pending';
  end if;

  update public.products
  set name=v_name,
      price=p_price,
      stock=p_stock,
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
      'policy','price_and_stock_preserve_lifecycle; content_fields_require_review'
    )
  );

  return true;
end;
$function$;


create or replace function public.velora_upsert_product_translation(
  p_product_id uuid,
  p_language_code text,
  p_name text,
  p_description text default null,
  p_seo_title text default null,
  p_seo_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_lang text := lower(nullif(trim(p_language_code),''));
  v_seller_id uuid;
  v_is_staff boolean := false;
  v_product_status text;
  v_old_name text;
  v_old_description text;
  v_old_seo_title text;
  v_old_seo_description text;
  v_translation_changed boolean := false;
  v_new_status text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if v_lang is null then raise exception 'language_required'; end if;

  select seller_id into v_seller_id
  from public.products
  where id=p_product_id;

  if v_seller_id is null then raise exception 'product_not_found'; end if;

  v_is_staff := public.velora_is_staff();

  if not (v_is_staff or exists(
    select 1 from public.sellers s
    where s.id=v_seller_id and s.user_id=v_uid
  )) then
    raise exception 'forbidden';
  end if;

  if nullif(trim(p_name),'') is null then raise exception 'translation_name_required'; end if;

  select p.status::text, t.name, t.description, t.seo_title, t.seo_description
    into v_product_status, v_old_name, v_old_description, v_old_seo_title, v_old_seo_description
  from public.products p
  left join public.product_translations t
    on t.product_id=p_product_id and t.language_code=v_lang
  where p.id=p_product_id
  for update;

  v_translation_changed :=
       v_old_name is null
    or trim(p_name) is distinct from v_old_name
    or nullif(trim(p_description),'') is distinct from v_old_description
    or nullif(trim(p_seo_title),'') is distinct from v_old_seo_title
    or nullif(trim(p_seo_description),'') is distinct from v_old_seo_description;

  insert into public.product_translations(
    product_id,language_code,name,description,seo_title,seo_description
  )
  values(
    p_product_id,
    v_lang,
    trim(p_name),
    nullif(trim(p_description),''),
    nullif(trim(p_seo_title),''),
    nullif(trim(p_seo_description),'')
  )
  on conflict(product_id,language_code)
  do update set
    name=excluded.name,
    description=excluded.description,
    seo_title=excluded.seo_title,
    seo_description=excluded.seo_description,
    updated_at=now();

  v_new_status := v_product_status;
  if v_translation_changed
     and not v_is_staff
     and v_product_status in ('approved','rejected') then
    v_new_status := 'pending';

    update public.products
    set status='pending'::public.product_status,
        updated_at=now()
    where id=p_product_id;
  end if;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,
    case when v_new_status='pending' and v_product_status<>v_new_status
         then 'seller_product_translation_re_review_required'
         else 'seller_product_translation_updated'
    end,
    'product',
    p_product_id,
    jsonb_build_object(
      'seller_id',v_seller_id,
      'language_code',v_lang,
      'previous_status',v_product_status,
      'new_status',v_new_status,
      'translation_changed',v_translation_changed,
      'staff_actor',v_is_staff,
      'policy','seller_translation_changes_require_review_on_approved_or_rejected_products'
    )
  );

  return jsonb_build_object(
    'ok',true,
    'product_id',p_product_id,
    'language_code',v_lang,
    'status',v_new_status,
    'review_required',v_new_status='pending' and v_product_status<>v_new_status
  );
end;
$function$;
