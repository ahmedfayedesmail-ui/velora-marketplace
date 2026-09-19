-- S2-E Notifications foundation
-- Applied on Restore-Test as migration 20260919060045.
-- Production remains FROZEN.

alter table public.notifications drop constraint if exists notifications_user_id_fkey;
alter table public.notifications
  add constraint notifications_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

drop policy if exists velora_notifications_all on public.notifications;
drop policy if exists velora_notifications_owner on public.notifications;
drop policy if exists velora_notifications_mark_read on public.notifications;
drop policy if exists velora_notifications_update on public.notifications;

alter table public.notifications enable row level security;

create policy velora_notifications_authenticated_read
on public.notifications
for select
to authenticated
using (user_id = (select auth.uid()));

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;

create or replace function private.velora_create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_id uuid;
begin
  if p_user_id is null then raise exception 'NOTIFICATION_RECIPIENT_REQUIRED'; end if;

  if not exists (select 1 from public.users u where u.id = p_user_id) then
    raise exception 'NOTIFICATION_RECIPIENT_NOT_FOUND';
  end if;

  if nullif(trim(p_type), '') is null or length(p_type) > 50 then
    raise exception 'INVALID_NOTIFICATION_TYPE';
  end if;

  if nullif(trim(p_title), '') is null or length(p_title) > 200 then
    raise exception 'INVALID_NOTIFICATION_TITLE';
  end if;

  if p_body is not null and length(p_body) > 2000 then
    raise exception 'INVALID_NOTIFICATION_BODY';
  end if;

  if p_entity_type is not null and length(p_entity_type) > 50 then
    raise exception 'INVALID_NOTIFICATION_ENTITY_TYPE';
  end if;

  insert into public.notifications(
    user_id,type,title,body,entity_type,entity_id
  )
  values(
    p_user_id,trim(p_type),trim(p_title),nullif(trim(p_body),''),nullif(trim(p_entity_type),''),p_entity_id
  )
  returning id into v_id;

  return v_id;
end;
$function$;

revoke all on function private.velora_create_notification(uuid,text,text,text,text,uuid) from public, anon, authenticated;

create or replace function public.velora_get_notifications(
  p_limit integer default 20,
  p_offset integer default 0
)
returns table(
  id uuid,
  type text,
  title text,
  body text,
  entity_type text,
  entity_id uuid,
  is_read boolean,
  created_at timestamptz,
  read_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select n.id,n.type,n.title,n.body,n.entity_type,n.entity_id,n.is_read,n.created_at,n.read_at
  from public.notifications n
  where n.user_id=(select auth.uid())
  order by n.created_at desc,n.id desc
  limit least(greatest(coalesce(p_limit,20),1),100)
  offset greatest(coalesce(p_offset,0),0);
$function$;

create or replace function public.velora_get_unread_notification_count()
returns integer
language sql
stable
security invoker
set search_path = ''
as $function$
  select count(*)::integer
  from public.notifications n
  where n.user_id=(select auth.uid()) and n.is_read=false;
$function$;

create or replace function public.velora_mark_notification_read(p_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_updated boolean := false;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED'; end if;

  update public.notifications
  set is_read=true,read_at=coalesce(read_at,now())
  where id=p_notification_id
    and user_id=(select auth.uid())
    and is_read=false;

  v_updated := found;
  return v_updated;
end;
$function$;

create or replace function public.velora_mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_count integer := 0;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED'; end if;

  update public.notifications
  set is_read=true,read_at=coalesce(read_at,now())
  where user_id=(select auth.uid()) and is_read=false;

  get diagnostics v_count=row_count;
  return v_count;
end;
$function$;

revoke all on function public.velora_get_notifications(integer,integer) from public, anon, authenticated;
revoke all on function public.velora_get_unread_notification_count() from public, anon, authenticated;
revoke all on function public.velora_mark_notification_read(uuid) from public, anon, authenticated;
revoke all on function public.velora_mark_all_notifications_read() from public, anon, authenticated;

grant execute on function public.velora_get_notifications(integer,integer) to authenticated;
grant execute on function public.velora_get_unread_notification_count() to authenticated;
grant execute on function public.velora_mark_notification_read(uuid) to authenticated;
grant execute on function public.velora_mark_all_notifications_read() to authenticated;

create or replace function public.velora_submit_review(
  p_product_id uuid,
  p_order_item_id uuid,
  p_rating smallint,
  p_title text default null,
  p_content text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_customer_id uuid := (select auth.uid());
  v_order_id uuid;
  v_store_id uuid;
  v_seller_user_id uuid;
  v_review_id uuid;
  v_content text := nullif(trim(p_content), '');
  v_title text := nullif(trim(p_title), '');
begin
  if v_customer_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'INVALID_REVIEW_RATING'; end if;
  if v_content is null or length(v_content) < 10 or length(v_content) > 2000 then raise exception 'INVALID_REVIEW_CONTENT'; end if;
  if v_title is not null and length(v_title) > 150 then raise exception 'INVALID_REVIEW_TITLE'; end if;

  select oi.order_id,oi.store_id,s.user_id
  into v_order_id,v_store_id,v_seller_user_id
  from public.order_items oi
  join public.orders o on o.id=oi.order_id
  join public.products p on p.id=oi.product_id
  join public.sellers s on s.id=p.seller_id
  where oi.id=p_order_item_id
    and oi.product_id=p_product_id
    and o.customer_id=v_customer_id
    and o.status='delivered'
  limit 1;

  if v_order_id is null then raise exception 'REVIEW_PURCHASE_REQUIRED'; end if;

  if exists(
    select 1 from public.reviews r
    where r.customer_id=v_customer_id and r.order_item_id=p_order_item_id
  ) then raise exception 'REVIEW_ALREADY_EXISTS'; end if;

  insert into public.reviews(
    product_id,store_id,customer_id,order_id,order_item_id,
    rating,title,content,is_verified_purchase,status
  )
  values(
    p_product_id,v_store_id,v_customer_id,v_order_id,p_order_item_id,
    p_rating,v_title,v_content,true,'pending'
  )
  returning id into v_review_id;

  perform private.velora_create_notification(
    v_seller_user_id,
    'review',
    'New review received',
    'A customer submitted a review for one of your products.',
    'review',
    v_review_id
  );

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_customer_id,'review_submitted','review',v_review_id,
    jsonb_build_object(
      'product_id',p_product_id,'order_id',v_order_id,'order_item_id',p_order_item_id,
      'rating',p_rating,'verified_purchase',true,'status','pending'
    )
  );

  return jsonb_build_object(
    'ok',true,'review_id',v_review_id,'status','pending',
    'is_verified_purchase',true,'order_id',v_order_id,'order_item_id',p_order_item_id
  );
exception
  when unique_violation then raise exception 'REVIEW_ALREADY_EXISTS';
end
$function$;

create or replace function private.velora_notify_order_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.customer_id is null then return new; end if;

  begin
    if tg_op='INSERT' then
      perform private.velora_create_notification(
        new.customer_id,'order','Order received',
        'Your order #' || new.order_number::text || ' has been placed.',
        'order',new.id
      );
    elsif tg_op='UPDATE' and new.status is distinct from old.status then
      perform private.velora_create_notification(
        new.customer_id,'order_status','Order status updated',
        'Your order #' || new.order_number::text || ' is now ' || new.status::text || '.',
        'order',new.id
      );
    end if;
  exception when others then
    raise warning 'S2-E order notification failed: %',sqlerrm;
  end;

  return new;
end;
$function$;

drop trigger if exists trg_velora_order_notifications on public.orders;
create trigger trg_velora_order_notifications
after insert or update of status on public.orders
for each row execute function private.velora_notify_order_event();

create or replace function private.velora_notify_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  begin
    perform private.velora_create_notification(
      new.id,'welcome','Welcome to Velora',
      'Thanks for joining Velora. Start exploring products and shopping.',
      'user',new.id
    );
  exception when others then
    raise warning 'S2-E welcome notification failed: %',sqlerrm;
  end;
  return new;
end;
$function$;

drop trigger if exists trg_velora_user_welcome_notification on public.users;
create trigger trg_velora_user_welcome_notification
after insert on public.users
for each row execute function private.velora_notify_new_user();

create or replace function private.velora_notify_seller_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.status is distinct from old.status
     and new.user_id is not null
     and new.status::text in ('approved','rejected') then
    begin
      perform private.velora_create_notification(
        new.user_id,
        'seller_' || new.status::text,
        case when new.status::text='approved' then 'Seller account approved' else 'Seller application rejected' end,
        case when new.status::text='approved'
          then 'Your seller account has been approved.'
          else 'Your seller application was rejected.'
        end,
        'seller',new.id
      );
    exception when others then
      raise warning 'S2-E seller notification failed: %',sqlerrm;
    end;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_velora_seller_status_notification on public.sellers;
create trigger trg_velora_seller_status_notification
after update of status on public.sellers
for each row execute function private.velora_notify_seller_status();

create or replace function private.velora_notify_product_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid;
begin
  if new.status is distinct from old.status
     and new.status::text in ('approved','rejected') then
    select s.user_id into v_user_id from public.sellers s where s.id=new.seller_id;

    if v_user_id is not null then
      begin
        perform private.velora_create_notification(
          v_user_id,
          'product_' || new.status::text,
          case when new.status::text='approved' then 'Product approved' else 'Product rejected' end,
          case when new.status::text='approved'
            then 'Your product "' || new.name || '" has been approved.'
            else 'Your product "' || new.name || '" has been rejected.'
          end,
          'product',new.id
        );
      exception when others then
        raise warning 'S2-E product notification failed: %',sqlerrm;
      end;
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_velora_product_status_notification on public.products;
create trigger trg_velora_product_status_notification
after update of status on public.products
for each row execute function private.velora_notify_product_status();
