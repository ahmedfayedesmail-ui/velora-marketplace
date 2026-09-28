-- Restore-Test only.
-- Corrective migration for seller translation re-review enforcement.
-- Lock the product row and translation row separately; PostgreSQL does not
-- allow FOR UPDATE against the nullable side of an outer join.

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

  select p.seller_id, p.status::text
    into v_seller_id, v_product_status
  from public.products p
  where p.id=p_product_id
  for update;

  if v_seller_id is null then raise exception 'product_not_found'; end if;

  v_is_staff := public.velora_is_staff();

  if not (v_is_staff or exists(
    select 1 from public.sellers s
    where s.id=v_seller_id and s.user_id=v_uid
  )) then
    raise exception 'forbidden';
  end if;

  if nullif(trim(p_name),'') is null then raise exception 'translation_name_required'; end if;

  select name, description, seo_title, seo_description
    into v_old_name, v_old_description, v_old_seo_title, v_old_seo_description
  from public.product_translations
  where product_id=p_product_id
    and language_code=v_lang
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
