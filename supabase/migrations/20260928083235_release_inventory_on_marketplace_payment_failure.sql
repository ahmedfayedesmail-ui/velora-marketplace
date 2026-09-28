-- Restore-Test source provenance reconstruction.
-- This migration version is already applied in Restore-Test.
-- Effective runtime was verified from PostgreSQL. Byte-for-byte historical identity is not claimed.
-- Production remains FROZEN.
--
-- Release marketplace inventory when a marketplace payment attempt definitively fails.
create or replace function private.velora_release_inventory_after_failed_marketplace_payment()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_order record;
  v_item record;
begin
  if new.purpose <> 'marketplace_order' or new.status <> 'failed' or new.order_id is null then
    return new;
  end if;

  select * into v_order
  from public.orders
  where id=new.order_id
  for update;

  if not found then
    raise warning 'Inventory release skipped: order % not found for failed payment attempt %', new.order_id, new.id;
    return new;
  end if;

  if v_order.payment_status::text <> 'pending'
     or v_order.status::text not in ('pending','confirmed') then
    return new;
  end if;

  for v_item in
    select oi.*
    from public.order_items oi
    where oi.order_id=new.order_id
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

  update public.order_items
  set status='cancelled'
  where order_id=new.order_id
    and status <> 'cancelled';

  update public.orders
  set status='cancelled',
      payment_status='failed',
      updated_at=now()
  where id=new.order_id;

  update public.payments
  set status='failed',
      updated_at=now()
  where order_id=new.order_id
    and status='pending';

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    null,
    'payment_failed_inventory_released',
    'order',
    new.order_id,
    jsonb_build_object('payment_attempt_id',new.id,'purpose',new.purpose,'restocked',true)
  );

  return new;
end;
$function$;

drop trigger if exists trg_velora_release_inventory_after_failed_payment
  on public.payment_attempts;

create trigger trg_velora_release_inventory_after_failed_payment
after update of status on public.payment_attempts
for each row
when (new.status='failed')
execute function private.velora_release_inventory_after_failed_marketplace_payment();
