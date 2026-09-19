-- Rollback for 20260919060045_s2e_notifications_foundation
-- Restore the previous notifications FK/policies/grants and remove S2-E trigger functions.

drop trigger if exists trg_velora_product_status_notification on public.products;
drop trigger if exists trg_velora_seller_status_notification on public.sellers;
drop trigger if exists trg_velora_user_welcome_notification on public.users;
drop trigger if exists trg_velora_order_notifications on public.orders;

drop function if exists private.velora_notify_product_status();
drop function if exists private.velora_notify_seller_status();
drop function if exists private.velora_notify_new_user();
drop function if exists private.velora_notify_order_event();
drop function if exists private.velora_create_notification(uuid,text,text,text,text,uuid);

drop function if exists public.velora_mark_all_notifications_read();
drop function if exists public.velora_mark_notification_read(uuid);
drop function if exists public.velora_get_unread_notification_count();
drop function if exists public.velora_get_notifications(integer,integer);

-- Restore the pre-S2-E review function from the S2-C migration.
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

  select oi.order_id,oi.store_id,s.user_id into v_order_id,v_store_id,v_seller_user_id
  from public.order_items oi
  join public.orders o on o.id=oi.order_id
  join public.products p on p.id=oi.product_id
  join public.sellers s on s.id=p.seller_id
  where oi.id=p_order_item_id and oi.product_id=p_product_id and o.customer_id=v_customer_id and o.status='delivered'
  limit 1;

  if v_order_id is null then raise exception 'REVIEW_PURCHASE_REQUIRED'; end if;

  if exists(select 1 from public.reviews r where r.customer_id=v_customer_id and r.order_item_id=p_order_item_id)
  then raise exception 'REVIEW_ALREADY_EXISTS'; end if;

  insert into public.reviews(
    product_id,store_id,customer_id,order_id,order_item_id,rating,title,content,is_verified_purchase,status
  )
  values(p_product_id,v_store_id,v_customer_id,v_order_id,p_order_item_id,p_rating,v_title,v_content,true,'pending')
  returning id into v_review_id;

  insert into public.notifications(user_id,type,title,body,entity_type,entity_id)
  values(v_seller_user_id,'review','New review received','A customer submitted a review for one of your products.','review',v_review_id);

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_customer_id,'review_submitted','review',v_review_id,
    jsonb_build_object('product_id',p_product_id,'order_id',v_order_id,'order_item_id',p_order_item_id,'rating',p_rating,'verified_purchase',true,'status','pending')
  );

  return jsonb_build_object('ok',true,'review_id',v_review_id,'status','pending','is_verified_purchase',true,'order_id',v_order_id,'order_item_id',p_order_item_id);
exception when unique_violation then
  raise exception 'REVIEW_ALREADY_EXISTS';
end
$function$;

grant execute on function public.velora_submit_review(uuid,uuid,smallint,text,text) to authenticated;

-- Restore previous notification FK/policies/grants.
alter table public.notifications drop constraint if exists notifications_user_id_fkey;
alter table public.notifications
  add constraint notifications_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

drop policy if exists velora_notifications_authenticated_read on public.notifications;
create policy velora_notifications_all on public.notifications as permissive for select
to authenticated using (user_id=(select auth.uid()));
create policy velora_notifications_mark_read on public.notifications as permissive for update
to authenticated using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));
create policy velora_notifications_owner on public.notifications as permissive for select
to authenticated using ((user_id=(select auth.uid())) or private.velora_is_staff());
create policy velora_notifications_update on public.notifications as permissive for update
to authenticated using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

revoke all on public.notifications from anon,authenticated;
grant select,insert,update on public.notifications to anon,authenticated;

-- RG-06 correction: the writer has a six-argument signature; dropping the zero-arg
-- overload would leave the active S2-E writer in place. No schema migration is required;
-- this is a rollback-artifact correctness fix only.
