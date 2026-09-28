-- Restore-Test only.
-- Record seller application submission in the existing audit trail.
-- No new event table or notification engine is introduced.

create or replace function public.velora_apply_as_seller(
  p_store_name text,
  p_store_slug text,
  p_business_name text default null,
  p_business_country_code text default null,
  p_business_category_id uuid default null,
  p_contact_phone text default null,
  p_business_description text default null,
  p_verification_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := (select auth.uid());
  v_id uuid;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists(
    select 1 from public.profiles
    where id=v_user and status='active'
  ) then
    raise exception 'PROFILE_NOT_ACTIVE';
  end if;

  if public.velora_has_role('seller') then
    raise exception 'ALREADY_SELLER';
  end if;

  if exists(
    select 1 from public.seller_applications
    where user_id=v_user
      and status in ('pending','under_review')
  ) then
    raise exception 'APPLICATION_ALREADY_EXISTS';
  end if;

  insert into public.seller_applications(
    user_id,
    requested_store_name,
    requested_store_slug,
    business_name,
    business_country_code,
    business_category_id,
    contact_phone,
    business_description,
    verification_data
  )
  values(
    v_user,
    trim(p_store_name),
    lower(trim(p_store_slug)),
    nullif(trim(p_business_name),''),
    upper(nullif(trim(p_business_country_code),'')),
    p_business_category_id,
    p_contact_phone,
    p_business_description,
    coalesce(p_verification_data,'{}'::jsonb)
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
    v_user,
    'seller_application_submitted',
    'seller_application',
    v_id,
    jsonb_build_object(
      'requested_store_name',trim(p_store_name),
      'requested_store_slug',lower(trim(p_store_slug)),
      'business_country_code',upper(nullif(trim(p_business_country_code),'')),
      'source','seller_registration'
    )
  );

  return v_id;
end;
$function$;
