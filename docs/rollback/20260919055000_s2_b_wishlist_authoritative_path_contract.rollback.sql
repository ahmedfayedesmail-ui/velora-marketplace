-- Rollback for 20260919055000_s2b_wishlist_authoritative_path

drop function if exists public.velora_merge_wishlist(uuid[]);
drop function if exists public.velora_get_wishlist();
drop function if exists public.velora_toggle_wishlist(uuid);

drop policy if exists velora_wishlist_authenticated_read on public.wishlists;
drop policy if exists velora_wishlist_items_authenticated_read on public.wishlist_items;
drop policy if exists velora_wishlist_owner on public.wishlists;
drop policy if exists velora_wishlist_self_read on public.wishlists;
drop policy if exists velora_wishlist_self_write on public.wishlists;
drop policy if exists velora_wishlists_all on public.wishlists;
drop policy if exists velora_wishlist_items_all on public.wishlist_items;
drop policy if exists velora_wishlist_items_owner on public.wishlist_items;
drop policy if exists velora_wishlist_items_self_read on public.wishlist_items;
drop policy if exists velora_wishlist_items_self_write on public.wishlist_items;

create policy velora_wishlist_owner on public.wishlists as permissive for all to authenticated
using (customer_id = (select auth.uid()))
with check (customer_id = (select auth.uid()));

create policy velora_wishlist_self_read on public.wishlists as permissive for select to authenticated
using (customer_id = (select auth.uid()));

create policy velora_wishlist_self_write on public.wishlists as permissive for all to authenticated
using (customer_id = (select auth.uid()))
with check (customer_id = (select auth.uid()));

create policy velora_wishlists_all on public.wishlists as permissive for all to authenticated
using (customer_id = (select auth.uid()))
with check (customer_id = (select auth.uid()));

create policy velora_wishlist_items_all on public.wishlist_items as permissive for all to authenticated
using (exists(select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.customer_id = (select auth.uid())))
with check (exists(select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.customer_id = (select auth.uid())));

create policy velora_wishlist_items_owner on public.wishlist_items as permissive for all to authenticated
using (exists(select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.customer_id = (select auth.uid())))
with check (exists(select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.customer_id = (select auth.uid())));

create policy velora_wishlist_items_self_read on public.wishlist_items as permissive for select to authenticated
using (exists(select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.customer_id = (select auth.uid())));

create policy velora_wishlist_items_self_write on public.wishlist_items as permissive for all to authenticated
using (exists(select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.customer_id = (select auth.uid())))
with check (exists(select 1 from public.wishlists w where w.id = wishlist_items.wishlist_id and w.customer_id = (select auth.uid())));

drop index if exists public.idx_wishlist_items_wishlist_created_at;

revoke select on public.wishlists, public.wishlist_items from anon, authenticated;
grant select, insert, update, delete on public.wishlists, public.wishlist_items to anon, authenticated;

create or replace function public.velora_get_wishlist()
returns jsonb language sql stable security definer set search_path = 'public'
as $function$
 select coalesce(jsonb_agg(jsonb_build_object('product_id',wi.product_id) order by wi.created_at desc),'[]'::jsonb)
 from public.wishlist_items wi join public.wishlists w on w.id=wi.wishlist_id
 where w.customer_id=(select auth.uid());
$function$;

create or replace function public.velora_toggle_wishlist(p_product_id uuid)
returns jsonb language plpgsql security definer set search_path = 'public'
as $function$
declare v_uid uuid := (select auth.uid()); v_wishlist_id uuid; v_exists boolean;
begin
 if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
 if not exists(select 1 from public.products p where p.id=p_product_id and p.status::text='approved') then raise exception 'PRODUCT_NOT_AVAILABLE'; end if;
 insert into public.wishlists(customer_id) values(v_uid) on conflict(customer_id) do nothing;
 select id into v_wishlist_id from public.wishlists where customer_id=v_uid;
 select exists(select 1 from public.wishlist_items wi where wi.wishlist_id=v_wishlist_id and wi.product_id=p_product_id) into v_exists;
 if v_exists then
   delete from public.wishlist_items where wishlist_id=v_wishlist_id and product_id=p_product_id;
 else
   insert into public.wishlist_items(wishlist_id,product_id) values(v_wishlist_id,p_product_id) on conflict(wishlist_id,product_id) do nothing;
 end if;
 return jsonb_build_object('ok',true,'is_favorite',not v_exists);
end;
$function$;

grant execute on function public.velora_get_wishlist() to anon, authenticated;
grant execute on function public.velora_toggle_wishlist(uuid) to anon, authenticated;
