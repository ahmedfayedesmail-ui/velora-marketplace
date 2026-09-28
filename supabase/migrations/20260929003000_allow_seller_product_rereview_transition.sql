-- Restore-Test only.
-- Preserve Staff-only product status authority while allowing the product owner
-- to move an approved/rejected product to pending when a material edit requires
-- moderation. No other seller-driven status transition is permitted.

create or replace function private.velora_guard_product_mutation()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if public.velora_is_staff() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not exists (
      select 1
      from public.sellers s
      where s.id = new.seller_id
        and s.user_id = auth.uid()
        and s.status = 'approved'
    ) then
      raise exception 'SELLER_NOT_ACTIVE';
    end if;

    if not exists (
      select 1
      from public.stores st
      where st.id = new.store_id
        and st.owner_id = auth.uid()
        and st.status = 'approved'
    ) then
      raise exception 'STORE_NOT_ACTIVE';
    end if;

    perform public.velora_assert_seller_product_capacity(new.seller_id);

    new.status := 'pending'::product_status;
    new.rating := 0;
    new.review_count := 0;
    return new;
  end if;

  if new.seller_id is distinct from old.seller_id then
    raise exception 'PROTECTED_FIELD';
  end if;
  if new.store_id is distinct from old.store_id then
    raise exception 'PROTECTED_FIELD';
  end if;
  if new.status is distinct from old.status then
    if not (
      new.status = 'pending'::product_status
      and old.status::text in ('approved','rejected')
      and exists (
        select 1
        from public.sellers s
        where s.id = old.seller_id
          and s.user_id = auth.uid()
          and s.status = 'approved'
      )
    ) then
      raise exception 'STATUS_CHANGE_REQUIRES_STAFF';
    end if;
  end if;
  if new.rating is distinct from old.rating then
    raise exception 'PROTECTED_FIELD';
  end if;
  if new.review_count is distinct from old.review_count then
    raise exception 'PROTECTED_FIELD';
  end if;

  return new;
end;
$function$;
