-- S2-C Reviews + Ratings authoritative path
create or replace function private.velora_refresh_review_aggregates(p_product_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_seller_id uuid;
begin
  select p.seller_id into v_seller_id from public.products p where p.id=p_product_id;
  if v_seller_id is null then return; end if;
  update public.products p set rating=coalesce((select round(avg(r.rating)::numeric,2) from public.reviews r where r.product_id=p.id and r.status='published'),0),
    review_count=coalesce((select count(*) from public.reviews r where r.product_id=p.id and r.status='published'),0),updated_at=now() where p.id=p_product_id;
  update public.sellers s set rating=coalesce((select round(avg(r.rating)::numeric,2) from public.reviews r join public.products p2 on p2.id=r.product_id where p2.seller_id=s.id and r.status='published'),0),
    total_reviews=coalesce((select count(*) from public.reviews r join public.products p2 on p2.id=r.product_id where p2.seller_id=s.id and r.status='published'),0),updated_at=now() where s.id=v_seller_id;
end $$;
revoke all on function private.velora_refresh_review_aggregates(uuid) from public,anon,authenticated;

create or replace function private.velora_reviews_refresh_aggregates_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE','DELETE') then perform private.velora_refresh_review_aggregates(old.product_id); end if;
  if tg_op in ('INSERT','UPDATE') then perform private.velora_refresh_review_aggregates(new.product_id); end if;
  return coalesce(new,old);
end $$;
revoke all on function private.velora_reviews_refresh_aggregates_trg() from public,anon,authenticated;
drop trigger if exists trg_reviews_refresh_aggregates on public.reviews;
create trigger trg_reviews_refresh_aggregates after insert or update of product_id,rating,status or delete on public.reviews for each row execute function private.velora_reviews_refresh_aggregates_trg();

drop policy if exists velora_reviews_seller_read on public.reviews;
create policy velora_reviews_seller_read on public.reviews for select to authenticated
using (exists(select 1 from public.products p join public.sellers s on s.id=p.seller_id where p.id=reviews.product_id and s.user_id=(select auth.uid())));

create or replace function public.velora_get_product_reviews(p_product_id uuid,p_limit integer default 20,p_offset integer default 0)
returns table(id uuid,reviewer_name text,rating smallint,title text,content text,is_verified_purchase boolean,created_at timestamptz)
language sql security definer set search_path = '' as $$
 select r.id,'Customer'::text,r.rating,r.title,r.content,r.is_verified_purchase,r.created_at
 from public.reviews r where r.product_id=p_product_id and r.status='published'
 order by r.created_at desc,r.id desc limit greatest(1,least(coalesce(p_limit,20),100)) offset greatest(coalesce(p_offset,0),0)
$$;
revoke all on function public.velora_get_product_reviews(uuid,integer,integer) from public,anon,authenticated;
grant execute on function public.velora_get_product_reviews(uuid,integer,integer) to anon,authenticated;

create or replace function public.velora_get_product_review_summary(p_product_id uuid)
returns jsonb language sql security definer set search_path = '' as $$
 select jsonb_build_object('product_id',p_product_id,'average_rating',coalesce(round(avg(r.rating)::numeric,2),0),'review_count',count(*)::integer,
   'distribution',jsonb_build_object('1',count(*) filter(where r.rating=1),'2',count(*) filter(where r.rating=2),'3',count(*) filter(where r.rating=3),'4',count(*) filter(where r.rating=4),'5',count(*) filter(where r.rating=5)))
 from public.reviews r where r.product_id=p_product_id and r.status='published'
$$;
revoke all on function public.velora_get_product_review_summary(uuid) from public,anon,authenticated;
grant execute on function public.velora_get_product_review_summary(uuid) to anon,authenticated;

create or replace function public.velora_get_review_eligibility(p_product_id uuid)
returns jsonb language sql security definer set search_path = '' as $$
 with candidates as (
  select oi.id order_item_id,oi.order_id,o.created_at from public.order_items oi join public.orders o on o.id=oi.order_id
  where o.customer_id=(select auth.uid()) and o.status='delivered' and oi.product_id=p_product_id
    and not exists(select 1 from public.reviews r where r.customer_id=(select auth.uid()) and r.order_item_id=oi.id)
  order by o.created_at desc limit 1)
 select coalesce((select jsonb_build_object('eligible',true,'order_item_id',c.order_item_id,'order_id',c.order_id) from candidates c),
   jsonb_build_object('eligible',false,'order_item_id',null,'order_id',null))
$$;
revoke all on function public.velora_get_review_eligibility(uuid) from public,anon,authenticated;
grant execute on function public.velora_get_review_eligibility(uuid) to authenticated;

create or replace function public.velora_submit_review(p_product_id uuid,p_order_item_id uuid,p_rating smallint,p_title text default null,p_content text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_customer_id uuid=(select auth.uid());v_order_id uuid;v_store_id uuid;v_seller_user_id uuid;v_review_id uuid;
v_content text=nullif(trim(p_content),'');v_title text=nullif(trim(p_title),'');
begin
 if v_customer_id is null then raise exception 'AUTH_REQUIRED'; end if;
 if p_rating is null or p_rating<1 or p_rating>5 then raise exception 'INVALID_REVIEW_RATING'; end if;
 if v_content is null or length(v_content)<10 or length(v_content)>2000 then raise exception 'INVALID_REVIEW_CONTENT'; end if;
 if v_title is not null and length(v_title)>150 then raise exception 'INVALID_REVIEW_TITLE'; end if;
 select oi.order_id,oi.store_id,s.user_id into v_order_id,v_store_id,v_seller_user_id
 from public.order_items oi join public.orders o on o.id=oi.order_id join public.products p on p.id=oi.product_id join public.sellers s on s.id=p.seller_id
 where oi.id=p_order_item_id and oi.product_id=p_product_id and o.customer_id=v_customer_id and o.status='delivered' limit 1;
 if v_order_id is null then raise exception 'REVIEW_PURCHASE_REQUIRED'; end if;
 if exists(select 1 from public.reviews r where r.customer_id=v_customer_id and r.order_item_id=p_order_item_id) then raise exception 'REVIEW_ALREADY_EXISTS'; end if;
 insert into public.reviews(product_id,store_id,customer_id,order_id,order_item_id,rating,title,content,is_verified_purchase,status)
 values(p_product_id,v_store_id,v_customer_id,v_order_id,p_order_item_id,p_rating,v_title,v_content,true,'pending') returning id into v_review_id;
 insert into public.notifications(user_id,type,title,body,entity_type,entity_id) values(v_seller_user_id,'review','New review received','A customer submitted a review for one of your products.','review',v_review_id);
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(v_customer_id,'review_submitted','review',v_review_id,jsonb_build_object('product_id',p_product_id,'order_id',v_order_id,'order_item_id',p_order_item_id,'rating',p_rating,'verified_purchase',true,'status','pending'));
 return jsonb_build_object('ok',true,'review_id',v_review_id,'status','pending','is_verified_purchase',true,'order_id',v_order_id,'order_item_id',p_order_item_id);
exception when unique_violation then raise exception 'REVIEW_ALREADY_EXISTS'; end $$;
revoke all on function public.velora_submit_review(uuid,uuid,smallint,text,text) from public,anon,authenticated;
grant execute on function public.velora_submit_review(uuid,uuid,smallint,text,text) to authenticated;

create or replace function public.velora_get_seller_reviews(p_limit integer default 50,p_offset integer default 0,p_status text default null)
returns table(id uuid,product_id uuid,product_name text,reviewer_name text,rating smallint,title text,content text,is_verified_purchase boolean,status text,created_at timestamptz)
language sql security definer set search_path = '' as $$
 select r.id,r.product_id,p.name,'Customer'::text,r.rating,r.title,r.content,r.is_verified_purchase,r.status,r.created_at
 from public.reviews r join public.products p on p.id=r.product_id join public.sellers s on s.id=p.seller_id
 where s.user_id=(select auth.uid()) and (p_status is null or r.status=p_status)
 order by r.created_at desc,r.id desc limit greatest(1,least(coalesce(p_limit,50),200)) offset greatest(coalesce(p_offset,0),0)
$$;
revoke all on function public.velora_get_seller_reviews(integer,integer,text) from public,anon,authenticated;
grant execute on function public.velora_get_seller_reviews(integer,integer,text) to authenticated;

create or replace function public.velora_get_review_moderation_queue(p_status text default 'pending',p_limit integer default 100,p_offset integer default 0)
returns table(id uuid,product_id uuid,product_name text,seller_id uuid,seller_name text,reviewer_name text,rating smallint,title text,content text,is_verified_purchase boolean,status text,created_at timestamptz)
language sql security definer set search_path = '' as $$
 select r.id,r.product_id,p.name,s.id,s.store_name,'Customer'::text,r.rating,r.title,r.content,r.is_verified_purchase,r.status,r.created_at
 from public.reviews r join public.products p on p.id=r.product_id join public.sellers s on s.id=p.seller_id
 where public.velora_is_staff() and (p_status is null or r.status=p_status)
 order by r.created_at asc,r.id asc limit greatest(1,least(coalesce(p_limit,100),200)) offset greatest(coalesce(p_offset,0),0)
$$;
revoke all on function public.velora_get_review_moderation_queue(text,integer,integer) from public,anon,authenticated;
grant execute on function public.velora_get_review_moderation_queue(text,integer,integer) to authenticated;

create or replace function public.velora_moderate_review(p_review_id uuid,p_status text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid=(select auth.uid());v_old_status text;v_product_id uuid;
begin
 if v_uid is null or not public.velora_is_staff() then raise exception 'STAFF_ONLY'; end if;
 if p_status not in ('pending','published','hidden','rejected') then raise exception 'INVALID_REVIEW_STATUS'; end if;
 select r.status,r.product_id into v_old_status,v_product_id from public.reviews r where r.id=p_review_id for update;
 if v_product_id is null then raise exception 'REVIEW_NOT_FOUND'; end if;
 update public.reviews set status=p_status,updated_at=now() where id=p_review_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(v_uid,'review_status_changed','review',p_review_id,jsonb_build_object('from',v_old_status,'to',p_status,'product_id',v_product_id));
 return jsonb_build_object('ok',true,'review_id',p_review_id,'old_status',v_old_status,'status',p_status);
end $$;
revoke all on function public.velora_moderate_review(uuid,text) from public,anon,authenticated;
grant execute on function public.velora_moderate_review(uuid,text) to authenticated;

create index if not exists idx_reviews_product_status_created_at on public.reviews(product_id,status,created_at desc);
create index if not exists idx_reviews_order_item_customer on public.reviews(order_item_id,customer_id);
create index if not exists idx_reviews_customer_product_status on public.reviews(customer_id,product_id,status);
