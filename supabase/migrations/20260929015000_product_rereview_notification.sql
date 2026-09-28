-- Velora Restore-Test only.
-- Extend the existing product-status notification path to include seller-requested
-- re-review. No second notification engine is introduced.

create or replace function private.velora_notify_product_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
  v_kind text;
  v_title text;
  v_body text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status::text='pending' and old.status::text in ('approved','rejected') then
    v_kind := 'product_re_review_required';
    v_title := 'Product review required';
    v_body := 'Your product "' || new.name || '" was updated and has been sent back for review.';
  elsif new.status::text='approved' and old.status::text='inactive' then
    v_kind := 'product_reactivated';
    v_title := 'Product reactivated';
    v_body := 'Your product "' || new.name || '" is visible again in the marketplace.';
  elsif new.status::text='approved' then
    v_kind := 'product_approved';
    v_title := 'Product approved';
    v_body := 'Your product "' || new.name || '" has been approved.';
  elsif new.status::text='rejected' then
    v_kind := 'product_rejected';
    v_title := 'Product rejected';
    v_body := 'Your product "' || new.name || '" has been rejected.';
  elsif new.status::text='inactive' then
    v_kind := 'product_inactive';
    v_title := 'Product deactivated';
    v_body := 'Your product "' || new.name || '" is no longer visible in the marketplace.';
  else
    return new;
  end if;

  select s.user_id
    into v_user_id
  from public.sellers s
  where s.id=new.seller_id;

  if v_user_id is not null then
    begin
      perform private.velora_create_notification(
        v_user_id,
        v_kind,
        v_title,
        v_body,
        'product',
        new.id
      );
    exception when others then
      raise warning 'S2-E product notification failed: %', sqlerrm;
    end;
  end if;

  return new;
end;
$function$;
