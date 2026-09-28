-- Velora Restore-Test only.
-- Seller profile is represented in both sellers and stores. Keep the
-- customer-facing store projection transactionally aligned with seller-owned
-- profile fields instead of allowing source/projection drift.

create or replace function public.velora_update_seller_profile(
  p_seller_id uuid,
  p_store_name text default null,
  p_store_slug text default null,
  p_description text default null,
  p_phone text default null,
  p_logo_url text default null,
  p_category text default null,
  p_product_type text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_row public.sellers;
  v_store public.stores;
  v_store_category_id uuid := null;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select *
    into v_row
  from public.sellers
  where id=p_seller_id
    and user_id=v_user
  for update;

  if not found then
    raise exception 'NOT_SELLER_OWNER';
  end if;

  if p_store_name is not null and length(trim(p_store_name))>200 then
    raise exception 'INVALID_STORE_NAME';
  end if;
  if p_store_slug is not null and (length(trim(p_store_slug))<3 or length(trim(p_store_slug))>120) then
    raise exception 'INVALID_STORE_SLUG';
  end if;
  if p_description is not null and length(p_description)>4000 then
    raise exception 'INVALID_SELLER_DESCRIPTION';
  end if;
  if p_phone is not null and length(p_phone)>50 then
    raise exception 'INVALID_SELLER_PHONE';
  end if;
  if p_logo_url is not null and length(trim(p_logo_url))>2048 then
    raise exception 'INVALID_LOGO_URL';
  end if;

  select *
    into v_store
  from public.stores
  where owner_id=v_user
  order by created_at
  limit 1
  for update;

  if not found then
    raise exception 'SELLER_STORE_NOT_FOUND';
  end if;

  update public.sellers
  set store_name=coalesce(nullif(trim(p_store_name),''),store_name),
      store_slug=coalesce(nullif(lower(trim(p_store_slug)),''),store_slug),
      description=coalesce(p_description,description),
      phone=coalesce(p_phone,phone),
      logo_url=coalesce(p_logo_url,logo_url),
      category=coalesce(p_category,category),
      product_type=coalesce(p_product_type,product_type),
      updated_at=now()
  where id=p_seller_id
    and user_id=v_user
  returning * into v_row;

  update public.stores
  set name=v_row.store_name,
      slug=v_row.store_slug,
      description=v_row.description,
      logo_url=v_row.logo_url,
      updated_at=now()
  where id=v_store.id
    and owner_id=v_user;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_user,
    'seller_profile_updated',
    'seller',
    p_seller_id,
    jsonb_build_object(
      'seller_id',p_seller_id,
      'store_id',v_store.id,
      'store_projection_synced',true
    )
  );

  return jsonb_build_object(
    'ok',true,
    'seller',jsonb_build_object(
      'id',v_row.id,
      'store_name',v_row.store_name,
      'store_slug',v_row.store_slug,
      'description',v_row.description,
      'phone',v_row.phone,
      'logo_url',v_row.logo_url,
      'category',v_row.category,
      'product_type',v_row.product_type,
      'status',v_row.status,
      'rating',v_row.rating,
      'total_reviews',v_row.total_reviews,
      'total_sales',v_row.total_sales,
      'total_orders',v_row.total_orders,
      'total_products',v_row.total_products
    ),
    'store',jsonb_build_object(
      'id',v_store.id,
      'name',v_row.store_name,
      'slug',v_row.store_slug,
      'description',v_row.description,
      'logo_url',v_row.logo_url,
      'country_code',v_store.country_code,
      'currency_code',v_store.currency_code,
      'language_code',v_store.language_code,
      'status',v_store.status
    )
  );
end;
$function$;
