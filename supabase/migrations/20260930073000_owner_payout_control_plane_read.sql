-- VELORA — Owner/Staff payout control-plane read surface
-- Read-only governance view over payouts; execution remains velora_record_payout_execution.
create or replace function public.velora_get_payout_control_plane()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_summary jsonb;
  v_rows jsonb;
begin
  if auth.uid() is null or not public.velora_is_staff() then
    raise exception 'STAFF_ONLY';
  end if;

  select jsonb_build_object(
    'total', count(*)::int,
    'pending_count', count(*) filter (where p.status='pending')::int,
    'processing_count', count(*) filter (where p.status='processing')::int,
    'paid_count', count(*) filter (where p.status='paid')::int,
    'pending_amount', coalesce(sum(p.amount) filter (where p.status='pending'),0),
    'processing_amount', coalesce(sum(p.amount) filter (where p.status='processing'),0),
    'paid_amount', coalesce(sum(p.amount) filter (where p.status='paid'),0),
    'paid_missing_ledger_count', count(*) filter (
      where p.status='paid'
        and not exists (
          select 1 from public.ledger_entries le
          where le.payout_id=p.id
            and le.type='payout'::public.ledger_entry_type
        )
    )::int
  )
  into v_summary
  from public.payouts p;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc), '[]'::jsonb)
  into v_rows
  from (
    select
      p.id,
      p.seller_id,
      coalesce(s.store_name,'Seller') as store_name,
      p.amount,
      p.currency,
      p.method,
      p.reference,
      p.status,
      p.requested_at,
      p.processed_at,
      p.created_at,
      p.updated_at,
      (select count(*)::int from public.seller_payout_items spi where spi.payout_id=p.id) as payout_item_count
    from public.payouts p
    left join public.sellers s on s.id=p.seller_id
    order by p.created_at desc
    limit 100
  ) q;

  return jsonb_build_object(
    'ok', true,
    'summary', coalesce(v_summary,'{}'::jsonb),
    'payouts', v_rows
  );
end;
$function$;

revoke all on function public.velora_get_payout_control_plane() from public, anon, authenticated;
grant execute on function public.velora_get_payout_control_plane() to authenticated;