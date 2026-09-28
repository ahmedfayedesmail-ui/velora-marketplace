-- Keep direct support-case inserts aligned with the canonical creation contract.
-- Non-staff users may create only a new, unassigned case for themselves.
create or replace function private.velora_guard_support_case_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := auth.uid();
  v_priority text := lower(trim(coalesce(new.priority,'medium')));
  v_type text := lower(trim(coalesce(new.case_type,'support')));
  v_order_owner boolean := false;
begin
  if public.velora_is_staff() then
    return new;
  end if;

  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if new.requester_user_id is distinct from v_uid then
    raise exception 'REQUESTER_MUST_MATCH_AUTH_USER';
  end if;

  if v_type not in ('support','order_issue','return','dispute','payment','shipping','product','account','fraud','technical') then
    raise exception 'INVALID_CASE_TYPE';
  end if;

  if v_priority not in ('low','medium','high','critical') then
    raise exception 'INVALID_PRIORITY';
  end if;

  if new.subject is null or length(trim(new.subject)) < 1 then
    raise exception 'INVALID_CASE_SUBJECT';
  end if;

  if length(new.subject) > 180 or length(coalesce(new.description,'')) > 5000 then
    raise exception 'SUPPORT_CASE_TEXT_TOO_LONG';
  end if;

  if new.order_id is not null then
    select exists(
      select 1
      from public.orders o
      where o.id = new.order_id
        and (
          o.customer_id = v_uid
          or exists(
            select 1
            from public.order_items oi
            join public.sellers s on s.id = oi.seller_id
            where oi.order_id = o.id
              and s.user_id = v_uid
          )
        )
    )
    into v_order_owner;

    if not v_order_owner then
      raise exception 'ORDER_ACCESS_DENIED';
    end if;
  end if;

  -- These fields are server-controlled by the canonical support lifecycle.
  new.status := 'open';
  new.owner_role := null;
  new.owner_user_id := null;
  new.resolved_at := null;
  new.sla_due_at := now() + case
    when v_priority='critical' then interval '2 hours'
    when v_priority='high' then interval '8 hours'
    else interval '24 hours'
  end;

  new.case_type := v_type;
  new.priority := v_priority;
  new.subject := left(trim(new.subject),180);
  new.description := left(coalesce(new.description,''),5000);
  if new.source_context is null or jsonb_typeof(new.source_context) <> 'object' then
    new.source_context := '{}'::jsonb;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_velora_guard_support_case_insert on public.support_cases;
create trigger trg_velora_guard_support_case_insert
before insert on public.support_cases
for each row
execute function private.velora_guard_support_case_insert();
