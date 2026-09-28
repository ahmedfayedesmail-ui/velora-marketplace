-- Stage A Action Flow: start the existing Seller onboarding lifecycle at approval.
-- Restore-Test / staging hardening. Production remains frozen.

create or replace function private.velora_review_seller_application(
  p_application_id uuid,
  p_decision text,
  p_rejection_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_app record;
  v_store_id uuid;
  v_seller_id uuid;
  v_currency text;
  v_language text;
  v_plan text;
begin
  if not public.velora_is_staff() then raise exception 'STAFF_ONLY'; end if;
  if lower(p_decision) not in ('approve','reject') then raise exception 'INVALID_DECISION'; end if;

  select * into v_app
  from public.seller_applications
  where id=p_application_id
  for update;

  if not found then raise exception 'APPLICATION_NOT_FOUND'; end if;
  if v_app.status not in ('pending','under_review') then raise exception 'APPLICATION_NOT_REVIEWABLE'; end if;

  if lower(p_decision)='reject' then
    update public.seller_applications
    set status='rejected',
        rejection_reason=nullif(trim(p_rejection_reason),''),
        reviewed_by=auth.uid(),
        reviewed_at=now(),
        updated_at=now()
    where id=p_application_id;

    insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
    values(
      auth.uid(),
      'seller_application_rejected',
      'seller_application',
      p_application_id,
      jsonb_build_object('reason',p_rejection_reason)
    );

    perform private.velora_create_notification(
      v_app.user_id,
      'seller_rejected',
      'Seller application rejected',
      'Your seller application was rejected.',
      'seller_application',
      p_application_id
    );

    return jsonb_build_object(
      'ok',true,
      'decision','rejected',
      'application_id',p_application_id
    );
  end if;

  if exists(select 1 from public.stores where slug=v_app.requested_store_slug) then
    raise exception 'STORE_SLUG_TAKEN';
  end if;

  v_currency:=coalesce(
    (select upper(preferred_currency) from public.profiles where id=v_app.user_id),
    'USD'
  );
  v_language:=coalesce(
    (select preferred_language from public.profiles where id=v_app.user_id),
    'en'
  );

  -- Do not trust applicant-supplied verification_data.plan for entitlements.
  v_plan:='free';

  update public.seller_applications
  set status='approved',
      reviewed_by=auth.uid(),
      reviewed_at=now(),
      updated_at=now()
  where id=p_application_id;

  insert into public.user_roles(user_id,role)
  values(v_app.user_id,'seller'::user_role)
  on conflict(user_id,role) do nothing;

  insert into public.stores(
    owner_id,name,slug,description,category_id,
    country_code,currency_code,language_code,status
  )
  values(
    v_app.user_id,
    v_app.requested_store_name,
    v_app.requested_store_slug,
    v_app.business_description,
    v_app.business_category_id,
    v_app.business_country_code,
    v_currency,
    v_language,
    'approved'
  )
  returning id into v_store_id;

  insert into public.sellers(
    user_id,store_name,store_slug,description,phone,license,
    category,product_type,plan,status,approved_at
  )
  values(
    v_app.user_id,
    v_app.requested_store_name,
    v_app.requested_store_slug,
    v_app.business_description,
    v_app.contact_phone,
    v_app.verification_data->>'license',
    null,
    v_app.verification_data->>'product_type',
    v_plan,
    'approved',
    now()
  )
  returning id into v_seller_id;

  -- Start the already-existing onboarding lifecycle from the approved boundary.
  -- All post-approval stages remain pending until their governed Staff decisions.
  insert into public.seller_onboarding_cases(
    seller_id,
    application_status,
    business_name,
    evidence_refs
  )
  values(
    v_seller_id,
    'approved',
    v_app.requested_store_name,
    '{}'::jsonb
  )
  on conflict (seller_id) do nothing;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    auth.uid(),
    'seller_application_approved',
    'seller',
    v_seller_id,
    jsonb_build_object(
      'application_id',p_application_id,
      'store_id',v_store_id,
      'initial_plan','free',
      'paid_plan_requires_subscription',true
    )
  );

  perform private.velora_create_notification(
    v_app.user_id,
    'seller_approved',
    'Seller account approved',
    'Your seller account has been approved.',
    'seller_application',
    p_application_id
  );

  return jsonb_build_object(
    'ok',true,
    'decision','approved',
    'application_id',p_application_id,
    'store_id',v_store_id,
    'seller_id',v_seller_id,
    'plan','free'
  );
end;
$function$;
