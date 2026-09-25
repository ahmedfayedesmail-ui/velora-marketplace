-- Restore-Test / staging only. Production remains frozen.

create or replace function public.velora_get_own_seller_onboarding_case()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_case public.seller_onboarding_cases;
  v_ready boolean:=false;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select c.* into v_case
  from public.seller_onboarding_cases c
  join public.sellers s on s.id=c.seller_id
  where s.user_id=v_uid
  order by c.created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('ok',true,'case',null,'beta_ready',false);
  end if;

  v_ready :=
    v_case.application_status='approved'
    and v_case.identity_status='verified'
    and v_case.catalog_status='approved'
    and v_case.sla_status='accepted'
    and v_case.pilot_status in ('active','passed')
    and v_case.authenticity_status in ('verified','not_required')
    and nullif(trim(v_case.contact_name),'') is not null
    and v_case.contact_channel in ('email','phone','whatsapp','other');

  return jsonb_build_object('ok',true,'case',to_jsonb(v_case),'beta_ready',v_ready);
end;
$function$;

revoke all on function public.velora_get_own_seller_onboarding_case() from public;
grant execute on function public.velora_get_own_seller_onboarding_case() to authenticated;

create or replace function public.velora_issue_gift_card(
  p_amount numeric,
  p_currency text default 'EGP',
  p_code text default null,
  p_recipient_id uuid default null,
  p_expires_at timestamptz default null
)
returns public.gift_cards
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_card public.gift_cards%rowtype;
  v_code text:=nullif(upper(trim(coalesce(p_code,''))),'');
  v_currency text:=upper(trim(coalesce(p_currency,'EGP')));
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.user_roles where user_id=v_uid and lower(role::text)='owner') then
    raise exception 'OWNER_ONLY';
  end if;
  if p_amount is null or p_amount<=0 then raise exception 'INVALID_GIFT_CARD_AMOUNT'; end if;
  if not exists(select 1 from public.currencies where code=v_currency and is_active) then raise exception 'INVALID_GIFT_CARD_CURRENCY'; end if;
  if p_expires_at is not null and p_expires_at<=now() then raise exception 'INVALID_GIFT_CARD_EXPIRY'; end if;
  if v_code is null then v_code:='VELORA-GC-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)); end if;
  if length(v_code)<8 or length(v_code)>80 then raise exception 'INVALID_GIFT_CARD_CODE'; end if;
  if exists(select 1 from public.gift_cards where code=v_code) then raise exception 'GIFT_CARD_CODE_EXISTS'; end if;

  insert into public.gift_cards(
    code,currency_code,initial_amount,balance_amount,status,purchaser_id,recipient_id,expires_at,metadata,created_at,updated_at
  ) values(
    v_code,v_currency,p_amount,p_amount,'active',v_uid,p_recipient_id,p_expires_at,'{}'::jsonb,now(),now()
  ) returning * into v_card;

  insert into public.gift_card_transactions(
    gift_card_id,customer_id,transaction_type,amount,balance_after,idempotency_key,metadata,created_at
  ) values(
    v_card.id,p_recipient_id,'issue',p_amount,p_amount,'issue:'||v_card.id,
    jsonb_build_object('issued_by',v_uid,'currency_code',v_currency),now()
  );

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,'gift_card_issued','gift_card',v_card.id,
    jsonb_build_object('amount',p_amount,'currency_code',v_currency,'recipient_id',p_recipient_id)
  );

  return v_card;
end;
$function$;

revoke all on function public.velora_issue_gift_card(numeric,text,text,uuid,timestamptz) from public;
grant execute on function public.velora_issue_gift_card(numeric,text,text,uuid,timestamptz) to authenticated;
