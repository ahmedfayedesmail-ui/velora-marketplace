-- Velora shipment status notifications
-- Restore-Test / staging only. Production remains frozen.
-- Reuse the existing notification/event foundation; do not create a second
-- notification delivery system.

create or replace function private.velora_notify_shipment_event()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_customer_id uuid;
  v_order_number text;
  v_title text;
  v_body text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  select
    o.customer_id,
    o.order_number::text
  into
    v_customer_id,
    v_order_number
  from public.orders o
  where o.id = new.order_id;

  if v_customer_id is null then
    return new;
  end if;

  case lower(new.status::text)
    when 'label_created' then
      v_title := 'Shipment label created';
      v_body := 'Your shipment for order #' || v_order_number || ' is being prepared.';
    when 'preparing' then
      v_title := 'Shipment is being prepared';
      v_body := 'Your shipment for order #' || v_order_number || ' is being prepared by the seller.';
    when 'shipped' then
      v_title := 'Shipment shipped';
      v_body := 'Your shipment for order #' || v_order_number || ' has been shipped.';
    when 'in_transit' then
      v_title := 'Shipment is in transit';
      v_body := 'Your shipment for order #' || v_order_number || ' is now in transit.';
    when 'delivered' then
      v_title := 'Shipment delivered';
      v_body := 'Your shipment for order #' || v_order_number || ' has been delivered.';
    when 'failed' then
      v_title := 'Shipment delivery issue';
      v_body := 'There is a delivery issue with your shipment for order #' || v_order_number || '.';
    when 'returned' then
      v_title := 'Shipment returned';
      v_body := 'Your shipment for order #' || v_order_number || ' has been returned.';
    when 'cancelled' then
      v_title := 'Shipment cancelled';
      v_body := 'Your shipment for order #' || v_order_number || ' has been cancelled.';
    else
      v_title := 'Shipment status updated';
      v_body := 'Your shipment for order #' || v_order_number ||
        ' is now ' || lower(new.status::text) || '.';
  end case;

  begin
    perform private.velora_create_notification(
      v_customer_id,
      'shipment_status',
      v_title,
      v_body,
      'shipment',
      new.id
    );
  exception when others then
    raise warning 'VELORA shipment notification failed: %', sqlerrm;
  end;

  return new;
end;
$function$;

drop trigger if exists trg_velora_shipment_notifications
  on public.shipments;

create trigger trg_velora_shipment_notifications
after update of status on public.shipments
for each row
execute function private.velora_notify_shipment_event();
