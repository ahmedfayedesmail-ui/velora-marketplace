-- S2-D Admin Dashboard read-only RPC
-- Applied on Restore-Test as migration 20260919061938 (name: s2_d_admin_dashboard_readonly).
-- Production remains FROZEN.

create or replace function public.velora_get_admin_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_result jsonb;
begin
  if not private.velora_is_staff() then
    raise exception 'ADMIN_ACCESS_REQUIRED';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'users', jsonb_build_object(
      'total', (select count(*) from public.users),
      'customers', (select count(*) from public.users where role::text='customer'),
      'staff', (select count(*) from public.users where role::text in ('admin','owner')),
      'inactive', (select count(*) from public.users where status::text <> 'active')
    ),
    'sellers', jsonb_build_object(
      'total', (select count(*) from public.sellers),
      'pending', (select count(*) from public.sellers where status::text='pending'),
      'approved', (select count(*) from public.sellers where status::text='approved'),
      'rejected', (select count(*) from public.sellers where status::text='rejected'),
      'suspended', (select count(*) from public.sellers where status::text='suspended')
    ),
    'products', jsonb_build_object(
      'total', (select count(*) from public.products),
      'pending', (select count(*) from public.products where status::text='pending'),
      'approved', (select count(*) from public.products where status::text='approved'),
      'rejected', (select count(*) from public.products where status::text='rejected')
    ),
    'orders', jsonb_build_object(
      'total', (select count(*) from public.orders),
      'pending', (select count(*) from public.orders where status::text='pending'),
      'confirmed', (select count(*) from public.orders where status::text='confirmed'),
      'processing', (select count(*) from public.orders where status::text='processing'),
      'shipped', (select count(*) from public.orders where status::text='shipped'),
      'delivered', (select count(*) from public.orders where status::text='delivered'),
      'cancelled', (select count(*) from public.orders where status::text='cancelled'),
      'refunded', (select count(*) from public.orders where status::text='refunded')
    ),
    'order_value_by_currency', coalesce((
      select jsonb_object_agg(x.currency, x.total_value)
      from (
        select currency, round(sum(total),2) as total_value
        from public.orders
        where status::text not in ('cancelled','refunded')
        group by currency
        order by currency
      ) x
    ), '{}'::jsonb),
    'payments', jsonb_build_object(
      'total', (select count(*) from public.payments),
      'pending', (select count(*) from public.payments where status::text='pending'),
      'paid', (select count(*) from public.payments where status::text in ('paid','captured')),
      'failed', (select count(*) from public.payments where status::text='failed'),
      'refunded', (select count(*) from public.payments where status::text='refunded')
    ),
    'payouts', jsonb_build_object(
      'total', (select count(*) from public.payouts),
      'pending', (select count(*) from public.payouts where status::text='pending'),
      'completed', (select count(*) from public.payouts where status::text in ('completed','paid')),
      'failed', (select count(*) from public.payouts where status::text='failed')
    ),
    'reviews', jsonb_build_object(
      'total', (select count(*) from public.reviews),
      'pending', (select count(*) from public.reviews where status='pending'),
      'published', (select count(*) from public.reviews where status='published'),
      'hidden', (select count(*) from public.reviews where status='hidden'),
      'rejected', (select count(*) from public.reviews where status='rejected')
    ),
    'security', jsonb_build_object(
      'active_account_actions', (
        select count(*) from public.account_actions
        where starts_at <= now()
          and (ends_at is null or ends_at > now())
          and action_type in ('suspend','ban','permanent_ban')
      )
    ),
    'attention', jsonb_build_object(
      'pending_sellers', (select count(*) from public.sellers where status::text='pending'),
      'pending_products', (select count(*) from public.products where status::text='pending'),
      'pending_reviews', (select count(*) from public.reviews where status='pending'),
      'failed_payments', (select count(*) from public.payments where status::text='failed'),
      'pending_payouts', (select count(*) from public.payouts where status::text='pending')
    ),
    'recent_orders', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', o.id,
          'order_number', o.order_number,
          'status', o.status::text,
          'payment_status', o.payment_status::text,
          'total', o.total,
          'currency', o.currency,
          'customer_name', o.customer_name,
          'created_at', o.created_at
        ) order by o.created_at desc, o.id desc
      )
      from (
        select * from public.orders
        order by created_at desc, id desc
        limit 10
      ) o
    ), '[]'::jsonb),
    'recent_audit_logs', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'action', a.action,
          'entity_type', a.entity_type,
          'entity_id', a.entity_id,
          'created_at', a.created_at
        ) order by a.created_at desc, a.id desc
      )
      from (
        select * from public.audit_logs
        order by created_at desc, id desc
        limit 10
      ) a
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$function$;

revoke all on function public.velora_get_admin_dashboard() from public, anon, authenticated;
grant execute on function public.velora_get_admin_dashboard() to authenticated;
