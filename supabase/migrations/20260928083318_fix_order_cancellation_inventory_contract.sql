-- Restore-Test source provenance reconstruction.
-- This migration version is already applied in Restore-Test.
-- Effective runtime was verified from PostgreSQL. Byte-for-byte historical identity is not claimed.
-- Production remains FROZEN.
--
-- Correct cancellation/inventory logic to use the current order_items contract.
create or replace function public.velora_cancel_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_customer uuid := auth.uid();
  v_order record;
  v_item record;
begin
  if v_customer is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_order
  from public.orders
  where id=p_order_id
  for update;

  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.customer_id <> v_customer then raise exception 'NOT_ORDER_OWNER'; end if;
  if v_order.payment_status::text <> 'pending' then raise exception 'ORDER_NOT_CANCELLABLE'; end if;
  if v_order.status::text not in ('pending','confirmed') then raise exception 'ORDER_NOT_CANCELLABLE'; end if;

  for v_item in
    select oi.*
    from public.order_items oi
    where oi.order_id=p_order_id
    for update
  loop
    if v_item.product_id is not null then
      if v_item.product_variant_id is not null then
        update public.product_variants
        set stock_quantity=stock_quantity+v_item.quantity,
            updated_at=now()
        where id=v_item.product_variant_id;
        if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
      end if;

      update public.products
      set stock=stock+v_item.quantity,
          updated_at=now()
      where id=v_item.product_id;
      if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    end if;

    update public.commissions
    set status='reversed'
    where order_item_id=v_item.id
      and status='pending';
  end loop;

  update public.orders
  set status='cancelled',
      payment_status='cancelled',
      updated_at=now()
  where id=p_order_id;

  update public.payments
  set status='cancelled', updated_at=now()
  where order_id=p_order_id
    and status='pending';

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_customer,'order_cancelled','order',p_order_id,jsonb_build_object('restocked',true));

  return jsonb_build_object('ok',true,'order_id',p_order_id,'status','cancelled');
end;
$function$;
