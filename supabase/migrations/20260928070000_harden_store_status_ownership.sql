-- Prevent seller-side self-approval or ownership changes on stores.
-- Staff/Owner operational RPCs remain allowed to manage status.
create or replace function private.velora_guard_store_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if public.velora_is_staff() then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if tg_op = 'INSERT' then
    if not exists (
      select 1
      from public.sellers s
      where s.user_id = auth.uid()
        and s.status = 'approved'
        and public.velora_has_role('seller')
    ) then
      raise exception 'SELLER_NOT_ACTIVE';
    end if;

    if new.owner_id is distinct from auth.uid() then
      raise exception 'NOT_STORE_OWNER';
    end if;

    -- Seller-created stores enter moderation; only Staff can approve them.
    new.status := 'pending';
    return new;
  end if;

  if new.owner_id is distinct from old.owner_id then
    raise exception 'PROTECTED_FIELD';
  end if;

  if new.status is distinct from old.status then
    raise exception 'STATUS_CHANGE_REQUIRES_STAFF';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_velora_guard_store_mutation on public.stores;
create trigger trg_velora_guard_store_mutation
before insert or update on public.stores
for each row
execute function private.velora_guard_store_mutation();
