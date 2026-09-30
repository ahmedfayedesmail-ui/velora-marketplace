-- VELORA — Owner/Staff subscription control-plane read surface
-- Read-only governance visibility over existing seller subscriptions, plans, and renewal jobs.
create or replace function public.velora_get_subscription_control_plane()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_summary jsonb;
  v_plans jsonb;
  v_subscriptions jsonb;
  v_renewals jsonb;
begin
  if auth.uid() is null or not public.velora_is_staff() then
    raise exception 'STAFF_ONLY';
  end if;

  select jsonb_build_object(
    'total', count(*)::int,
    'pending_count', count(*) filter (where ss.status='pending')::int,
    'active_count', count(*) filter (where ss.status='active')::int,
    'past_due_count', count(*) filter (where ss.status='past_due')::int,
    'cancelled_count', count(*) filter (where ss.status='cancelled')::int,
    'expired_count', count(*) filter (where ss.status='expired')::int,
    'paid_count', count(*) filter (where ss.payment_status='paid')::int,
    'pending_amount', coalesce(sum(ss.price) filter (where ss.status='pending'),0),
    'active_amount', coalesce(sum(ss.price) filter (where ss.status='active'),0)
  )
  into v_summary
  from public.seller_subscriptions ss;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.monthly_price asc, q.name asc), '[]'::jsonb)
  into v_plans
  from (
    select sp.id,sp.name,sp.monthly_price,sp.yearly_price,sp.currency_code,sp.commission_rate,sp.max_products,sp.features,sp.is_active,sp.created_at,sp.updated_at
    from public.subscription_plans sp
  ) q;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc), '[]'::jsonb)
  into v_subscriptions
  from (
    select ss.id,ss.store_id,coalesce(st.name,'Store') as store_name,st.owner_id,ss.plan_id,coalesce(sp.name,'Unknown plan') as plan_name,ss.status,ss.billing_cycle,ss.price,ss.currency_code,ss.payment_status,ss.payment_id,ss.started_at,ss.expires_at,ss.cancel_at,ss.pending_expires_at,ss.purchase_idempotency_key,ss.subscription_series_id,ss.created_at,ss.updated_at
    from public.seller_subscriptions ss
    left join public.stores st on st.id=ss.store_id
    left join public.subscription_plans sp on sp.id=ss.plan_id
    order by ss.created_at desc
    limit 100
  ) q;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc), '[]'::jsonb)
  into v_renewals
  from (
    select r.id,r.seller_subscription_id,r.status,r.attempt_count,r.next_attempt_at,r.lease_until,r.last_error_code,r.last_error_message,r.created_at,r.updated_at
    from public.seller_subscription_renewal_jobs r
    order by r.created_at desc
    limit 100
  ) q;

  return jsonb_build_object('ok',true,'summary',coalesce(v_summary,'{}'::jsonb),'plans',v_plans,'subscriptions',v_subscriptions,'renewal_jobs',v_renewals);
end;
$function$;

revoke all on function public.velora_get_subscription_control_plane() from public, anon, authenticated;
grant execute on function public.velora_get_subscription_control_plane() to authenticated;
