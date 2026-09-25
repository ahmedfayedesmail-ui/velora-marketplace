-- Restore-Test / staging only. Production remains frozen.
revoke all on table public.returns from anon,authenticated;
revoke all on table public.return_items from anon,authenticated;
drop policy if exists returns_customer_select on public.returns;
create policy returns_customer_select on public.returns for select to authenticated using(customer_id=auth.uid() or public.velora_is_staff());
drop policy if exists return_items_customer_select on public.return_items;
create policy return_items_customer_select on public.return_items for select to authenticated using(exists(select 1 from public.returns r where r.id=return_items.return_id and (r.customer_id=auth.uid() or public.velora_is_staff())));
alter table public.returns add column if not exists resolution_notes text, add column if not exists refund_reference text, add column if not exists refund_provider text, add column if not exists refund_method text, add column if not exists refund_processed_at timestamptz;
revoke all on function public.velora_request_return(uuid,uuid,jsonb,text,text) from public;
grant execute on function public.velora_request_return(uuid,uuid,jsonb,text,text) to authenticated;
revoke all on function public.velora_resolve_return(uuid,text,text,text,text,text) from public;
grant execute on function public.velora_resolve_return(uuid,text,text,text,text,text) to authenticated;
revoke all on function public.velora_create_shipment(uuid,uuid[],text,text,text,text,timestamptz) from public;
grant execute on function public.velora_create_shipment(uuid,uuid[],text,text,text,text,timestamptz) to authenticated;
