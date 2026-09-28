-- Keep transaction messages bound to the authenticated party and actual order participants.
create or replace function private.velora_guard_transaction_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := auth.uid();
  v_order_customer uuid;
  v_seller_match boolean := false;
begin
  if public.velora_is_staff() then
    return new;
  end if;

  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if new.actor_id is distinct from v_uid then
    raise exception 'ACTOR_MUST_MATCH_AUTH_USER';
  end if;

  select o.customer_id
    into v_order_customer
  from public.orders o
  where o.id = new.order_id;

  if v_order_customer is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if new.actor_role = 'customer' then
    if new.customer_id is distinct from v_uid then
      raise exception 'CUSTOMER_PARTICIPANT_MISMATCH';
    end if;

    if v_order_customer is distinct from v_uid then
      raise exception 'CUSTOMER_ORDER_ACCESS_DENIED';
    end if;

    if new.seller_id is not null then
      raise exception 'CUSTOMER_SELLER_REFERENCE_FORBIDDEN';
    end if;

  elsif new.actor_role = 'seller' then
    if new.customer_id is distinct from v_order_customer then
      raise exception 'ORDER_CUSTOMER_MISMATCH';
    end if;

    if new.seller_id is null
       or not exists (
         select 1
         from public.sellers s
         where s.id = new.seller_id
           and s.user_id = v_uid
       ) then
      raise exception 'SELLER_PARTICIPANT_MISMATCH';
    end if;

    select exists(
      select 1
      from public.order_items oi
      where oi.order_id = new.order_id
        and oi.seller_id = new.seller_id
    )
    into v_seller_match;

    if not v_seller_match then
      raise exception 'SELLER_ORDER_ACCESS_DENIED';
    end if;

  else
    raise exception 'INVALID_ACTOR_ROLE';
  end if;

  if new.message is null or length(btrim(new.message)) = 0 then
    raise exception 'MESSAGE_REQUIRED';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_velora_guard_transaction_message_insert on public.transaction_messages;
create trigger trg_velora_guard_transaction_message_insert
before insert on public.transaction_messages
for each row
execute function private.velora_guard_transaction_message_insert();
