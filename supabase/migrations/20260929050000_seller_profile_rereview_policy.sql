-- Velora Restore-Test only.
-- Post-approval Seller profile re-review policy:
--   material identity/store/compliance fields => approved/rejected -> pending
--   operational contact field (phone) => preserve lifecycle
-- All other seller/store status transitions remain Staff-only.
-- No new status model or schema is introduced.

create or replace function private.velora_guard_seller_mutation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_material_change boolean := false;
begin
  if public.velora_is_staff() then
    return new;
  end if;

  if tg_op='INSERT' then
    if new.user_id<>auth.uid() then raise exception 'FORBIDDEN'; end if;
    new.status:='pending'::seller_status;
    new.approved_at:=null;
    new.rejection_reason:=null;
    new.rating:=0;
    new.total_reviews:=0;
    new.total_sales:=0;
    new.total_orders:=0;
    new.total_products:=0;
    return new;
  end if;

  if new.user_id is distinct from old.user_id then raise exception 'FORBIDDEN'; end if;
  if new.plan is distinct from old.plan then raise exception 'PLAN_CHANGE_REQUIRES_STAFF'; end if;
  if new.approved_at is distinct from old.approved_at then raise exception 'PROTECTED_FIELD'; end if;
  if new.rejection_reason is distinct from old.rejection_reason then raise exception 'PROTECTED_FIELD'; end if;
  if new.rating is distinct from old.rating then raise exception 'PROTECTED_FIELD'; end if;
  if new.total_reviews is distinct from old.total_reviews then raise exception 'PROTECTED_FIELD'; end if;
  if new.total_sales is distinct from old.total_sales then raise exception 'PROTECTED_FIELD'; end if;
  if new.total_orders is distinct from old.total_orders then raise exception 'PROTECTED_FIELD'; end if;
  if new.total_products is distinct from old.total_products then raise exception 'PROTECTED_FIELD'; end if;

  v_material_change :=
       new.store_name is distinct from old.store_name
    or new.store_slug is distinct from old.store_slug
    or new.description is distinct from old.description
    or new.logo_url is distinct from old.logo_url
    or new.category is distinct from old.category
    or new.product_type is distinct from old.product_type;

  if new.status is distinct from old.status then
    if not (
      new.status='pending'::seller_status
      and old.status in ('approved','rejected')
      and v_material_change
      and new.user_id=auth.uid()
    ) then
      raise exception 'STATUS_CHANGE_REQUIRES_STAFF';
    end if;
  elsif old.status in ('approved','rejected')
       and v_material_change
       and new.user_id=auth.uid() then
    new.status:='pending'::seller_status;
  end if;

  return new;
end;
$function$;


create or replace function private.velora_guard_store_mutation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if public.velora_is_staff() then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if tg_op='INSERT' then
    if not exists (
      select 1
      from public.sellers s
      where s.user_id=auth.uid()
        and s.status='approved'
        and public.velora_has_role('seller')
    ) then
      raise exception 'SELLER_NOT_ACTIVE';
    end if;

    if new.owner_id is distinct from auth.uid() then
      raise exception 'NOT_STORE_OWNER';
    end if;

    new.status:='pending';
    return new;
  end if;

  if new.owner_id is distinct from old.owner_id then
    raise exception 'PROTECTED_FIELD';
  end if;

  if new.status is distinct from old.status then
    if not (
      new.status='pending'
      and old.status='approved'
      and exists (
        select 1 from public.sellers s
        where s.user_id=auth.uid()
          and s.status='pending'
      )
    ) then
      raise exception 'STATUS_CHANGE_REQUIRES_STAFF';
    end if;
  end if;

  return new;
end;
$function$;


create or replace function private.velora_notify_seller_status()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.status is distinct from old.status
     and new.user_id is not null
     and new.status::text in ('pending','approved','rejected') then
    begin
      perform private.velora_create_notification(
        new.user_id,
        case
          when new.status::text='pending' then 'seller_re_review_required'
          else 'seller_' || new.status::text
        end,
        case
          when new.status::text='pending' then 'Seller profile review required'
          when new.status::text='approved' then 'Seller account approved'
          else 'Seller application rejected'
        end,
        case
          when new.status::text='pending'
            then 'A material change to your seller profile requires a new review.'
          when new.status::text='approved'
            then 'Your seller account has been approved.'
          else 'Your seller application was rejected.'
        end,
        'seller',
        new.id
      );
    exception when others then
      raise warning 'S2-E seller notification failed: %', sqlerrm;
    end;
  end if;
  return new;
end;
$function$;


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
  v_before public.sellers;
  v_store public.stores;
  v_material_change boolean := false;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_row
  from public.sellers
  where id=p_seller_id and user_id=v_user
  for update;

  if not found then raise exception 'NOT_SELLER_OWNER'; end if;
  v_before:=v_row;

  if p_store_name is not null and length(trim(p_store_name))>200 then raise exception 'INVALID_STORE_NAME'; end if;
  if p_store_slug is not null and (length(trim(p_store_slug))<3 or length(trim(p_store_slug))>120) then raise exception 'INVALID_STORE_SLUG'; end if;
  if p_description is not null and length(p_description)>4000 then raise exception 'INVALID_SELLER_DESCRIPTION'; end if;
  if p_phone is not null and length(p_phone)>50 then raise exception 'INVALID_SELLER_PHONE'; end if;
  if p_logo_url is not null and length(trim(p_logo_url))>2048 then raise exception 'INVALID_LOGO_URL'; end if;

  v_material_change :=
       coalesce(nullif(trim(p_store_name),''),v_row.store_name) is distinct from v_row.store_name
    or coalesce(nullif(lower(trim(p_store_slug)),''),v_row.store_slug) is distinct from v_row.store_slug
    or coalesce(p_description,v_row.description) is distinct from v_row.description
    or coalesce(p_logo_url,v_row.logo_url) is distinct from v_row.logo_url
    or coalesce(p_category,v_row.category) is distinct from v_row.category
    or coalesce(p_product_type,v_row.product_type) is distinct from v_row.product_type;

  update public.sellers
  set store_name=coalesce(nullif(trim(p_store_name),''),store_name),
      store_slug=coalesce(nullif(lower(trim(p_store_slug)),''),store_slug),
      description=coalesce(p_description,description),
      phone=coalesce(p_phone,phone),
      logo_url=coalesce(p_logo_url,logo_url),
      category=coalesce(p_category,category),
      product_type=coalesce(p_product_type,product_type),
      updated_at=now()
  where id=p_seller_id and user_id=v_user
  returning * into v_row;

  select * into v_store
  from public.stores
  where owner_id=v_user
  order by created_at
  limit 1
  for update;

  if not found then raise exception 'SELLER_STORE_NOT_FOUND'; end if;

  update public.stores
  set name=v_row.store_name,
      slug=v_row.store_slug,
      description=v_row.description,
      logo_url=v_row.logo_url,
      status=case
        when v_material_change and v_before.status in ('approved','rejected') then 'pending'
        else status
      end,
      updated_at=now()
  where id=v_store.id
    and owner_id=v_user;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_user,
    case when v_material_change and v_before.status in ('approved','rejected')
      then 'seller_profile_re_review_required'
      else 'seller_profile_updated'
    end,
    'seller',
    p_seller_id,
    jsonb_build_object(
      'seller_id',p_seller_id,
      'store_id',v_store.id,
      'previous_status',v_before.status,
      'new_status',v_row.status,
      'store_projection_synced',true,
      'material_change',v_material_change,
      'policy','seller_identity_or_store_profile_changes_require_review; phone_is_operational_only'
    )
  );

  return jsonb_build_object(
    'ok',true,
    'review_required',v_material_change and v_before.status in ('approved','rejected'),
    'seller_status',v_row.status,
    'store_status',(
      select st.status from public.stores st where st.id=v_store.id
    ),
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
    )
  );
end;
$function$;
