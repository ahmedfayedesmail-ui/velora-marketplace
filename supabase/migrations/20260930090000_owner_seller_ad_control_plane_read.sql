-- VELORA — Owner/Staff seller advertising control-plane read surface
-- Read-only governance visibility over existing seller advertising packages, campaigns and ad payment attempts.

create or replace function public.velora_get_seller_ad_control_plane()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_summary jsonb;
  v_packages jsonb;
  v_campaigns jsonb;
  v_payments jsonb;
begin
  if auth.uid() is null or not public.velora_is_staff() then
    raise exception 'STAFF_ONLY';
  end if;

  select jsonb_build_object(
    'total_campaigns',count(*)::int,
    'pending_payment_count',count(*) filter (where c.status='pending_payment')::int,
    'active_count',count(*) filter (where c.status='active')::int,
    'completed_count',count(*) filter (where c.status='completed')::int,
    'payment_failed_count',count(*) filter (where c.status='payment_failed')::int,
    'cancelled_count',count(*) filter (where c.status='cancelled')::int,
    'refunded_count',count(*) filter (where c.status='refunded')::int,
    'active_value',coalesce(sum(c.price) filter (where c.status='active'),0),
    'campaign_value',coalesce(sum(c.price),0)
  )
  into v_summary
  from public.seller_ad_campaigns c;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.sort_order,q.created_at,q.id),'[]'::jsonb)
  into v_packages
  from (
    select p.id,p.code,p.name,p.description,p.placement,p.duration_days,p.price,p.currency_code,p.sort_order,p.is_active,p.created_at,p.updated_at
    from public.seller_ad_packages p
  ) q;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb)
  into v_campaigns
  from (
    select c.id,c.seller_id,c.store_id,coalesce(st.name,'Store') as store_name,c.product_id,coalesce(pr.name,'Product') as product_name,
           c.ad_package_id,coalesce(ap.name,'Package') as package_name,ap.code as package_code,ap.placement,ap.duration_days,
           c.status,c.price,c.currency_code,c.starts_at,c.ends_at,c.payment_attempt_id,c.state_reason,c.created_at,c.updated_at
    from public.seller_ad_campaigns c
    left join public.stores st on st.id=c.store_id
    left join public.products pr on pr.id=c.product_id
    left join public.seller_ad_packages ap on ap.id=c.ad_package_id
    order by c.created_at desc
    limit 100
  ) q;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb)
  into v_payments
  from (
    select pa.id,pa.seller_ad_campaign_id,pa.status,pa.amount,pa.currency_code,pa.provider_id,pa.provider_payment_id,
           pa.provider_session_id,pa.idempotency_key,pa.failure_code,pa.error_code,pa.created_at,pa.updated_at
    from public.payment_attempts pa
    where pa.purpose='seller_ad'
    order by pa.created_at desc
    limit 100
  ) q;

  return jsonb_build_object('ok',true,'summary',coalesce(v_summary,'{}'::jsonb),'packages',v_packages,'campaigns',v_campaigns,'payment_attempts',v_payments);
end;
$function$;

revoke all on function public.velora_get_seller_ad_control_plane() from public, anon, authenticated;
grant execute on function public.velora_get_seller_ad_control_plane() to authenticated;
