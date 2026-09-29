-- Velora Restore-Test only.
-- Corrective policy: do not overwrite the canonical store projection with
-- stale legacy seller fields when the seller did not change those fields.
-- Only explicitly supplied profile fields are synchronized to stores.

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
  v_store_fields_changed boolean := false;
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
       (p_store_name is not null and coalesce(nullif(trim(p_store_name),''),v_row.store_name) is distinct from v_row.store_name)
    or (p_store_slug is not null and coalesce(nullif(lower(trim(p_store_slug)),''),v_row.store_slug) is distinct from v_row.store_slug)
    or (p_description is not null and p_description is distinct from v_row.description)
    or (p_logo_url is not null and p_logo_url is distinct from v_row.logo_url)
    or (p_category is not null and p_category is distinct from v_row.category)
    or (p_product_type is not null and p_product_type is distinct from v_row.product_type);

  update public.sellers
  set store_name=case when p_store_name is null then store_name else coalesce(nullif(trim(p_store_name),''),store_name) end,
      store_slug=case when p_store_slug is null then store_slug else coalesce(nullif(lower(trim(p_store_slug)),''),store_slug) end,
      description=case when p_description is null then description else p_description end,
      phone=case when p_phone is null then phone else p_phone end,
      logo_url=case when p_logo_url is null then logo_url else p_logo_url end,
      category=case when p_category is null then category else p_category end,
      product_type=case when p_product_type is null then product_type else p_product_type end,
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

  v_store_fields_changed :=
       p_store_name is not null
    or p_store_slug is not null
    or p_description is not null
    or p_logo_url is not null;

  if v_store_fields_changed then
    if p_store_slug is not null
       and nullif(lower(trim(p_store_slug)),'') is not null
       and exists(
         select 1
         from public.stores other
         where other.slug=lower(trim(p_store_slug))
           and other.id<>v_store.id
       ) then
      raise exception 'STORE_SLUG_ALREADY_EXISTS';
    end if;

    update public.stores
    set name=case when p_store_name is null then name else coalesce(nullif(trim(p_store_name),''),name) end,
        slug=case when p_store_slug is null then slug else coalesce(nullif(lower(trim(p_store_slug)),''),slug) end,
        description=case when p_description is null then description else p_description end,
        logo_url=case when p_logo_url is null then logo_url else p_logo_url end,
        status=case
          when v_material_change and v_before.status in ('approved','rejected') then 'pending'
          else status
        end,
        updated_at=now()
    where id=v_store.id and owner_id=v_user;
  elsif v_material_change and v_before.status in ('approved','rejected') then
    update public.stores
    set status='pending',
        updated_at=now()
    where id=v_store.id and owner_id=v_user;
  end if;

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
      'store_projection_fields_changed',v_store_fields_changed,
      'material_change',v_material_change,
      'policy','seller_identity_or_store_profile_changes_require_review; phone_is_operational_only; only_explicit_store_fields_sync'
    )
  );

  return jsonb_build_object(
    'ok',true,
    'review_required',v_material_change and v_before.status in ('approved','rejected'),
    'seller_status',v_row.status,
    'store_status',(select st.status from public.stores st where st.id=v_store.id)
  );
end;
$function$;
