-- VELORA — Seller Ad Payment Initialization Failure
-- Close pre-webhook provider failures through the canonical payment attempt state machine.

create or replace function public.velora_mark_seller_ad_payment_initialization_failed(
  p_payment_attempt_id uuid,
  p_failure_code text,
  p_failure_reason text
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_uid uuid:=auth.uid();
  v_attempt public.payment_attempts%rowtype;
  v_updated public.payment_attempts%rowtype;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_payment_attempt_id is null then raise exception 'PAYMENT_ATTEMPT_REQUIRED'; end if;

  select pa.* into v_attempt
  from public.payment_attempts pa
  join public.seller_ad_campaigns c on c.id=pa.seller_ad_campaign_id
  join public.stores st on st.id=c.store_id
  where pa.id=p_payment_attempt_id
    and pa.user_id=v_uid
    and pa.purpose='seller_ad'
    and st.owner_id=v_uid
  for update;

  if not found then raise exception 'AD_PAYMENT_ATTEMPT_NOT_FOUND'; end if;

  if v_attempt.status in ('captured','refunded','failed','cancelled') then
    perform public.velora_sync_seller_ad_campaign(v_attempt.seller_ad_campaign_id);
    select * into v_updated from public.payment_attempts where id=v_attempt.id;
  else
    update public.payment_attempts
      set status='failed',
          failure_code=left(nullif(trim(coalesce(p_failure_code,'')),'')::text,200),
          failure_reason=left(nullif(trim(coalesce(p_failure_reason,'')),'')::text,500),
          error_code=left(nullif(trim(coalesce(p_failure_code,'')),'')::text,200),
          error_message=left(nullif(trim(coalesce(p_failure_reason,'')),'')::text,1000),
          completed_at=coalesce(completed_at,now()),
          updated_at=now()
    where id=v_attempt.id
    returning * into v_updated;

    perform public.velora_sync_seller_ad_campaign(v_attempt.seller_ad_campaign_id);
  end if;

  return jsonb_build_object(
    'ok',true,
    'payment_attempt_id',v_updated.id,
    'campaign_id',v_attempt.seller_ad_campaign_id,
    'status',v_updated.status,
    'failure_code',v_updated.failure_code
  );
end; $$;

revoke all on function public.velora_mark_seller_ad_payment_initialization_failed(uuid,text,text) from public,anon;
grant execute on function public.velora_mark_seller_ad_payment_initialization_failed(uuid,text,text) to authenticated;
