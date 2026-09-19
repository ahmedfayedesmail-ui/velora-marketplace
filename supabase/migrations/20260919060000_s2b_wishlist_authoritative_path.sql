-- Velora S2-B Wishlist authoritative path
-- Restore-Test first. Production must remain frozen.
-- Version: 20260919060000

create index if not exists public.idx_wishlist_items_wishlist_created_at
  on public.wishlist_items (wishlist_id, created_at desc, id);

drop policy if exists velora_wishlist_owner on public.wishlists;
drop policy if exists velora_wishlist_self_read on public.wishlists;
drop policy if exists velora_wishlist_self_write on public.wishlists;
drop policy if exists velora_wishlists_all on public.wishlists;
drop policy if exists velora_wishlist_items_all on public.wishlist_items;
drop policy if exists velora_wishlist_items_owner on public.wishlist_items;
drop policy if exists velora_wishlist_items_self_read on public.wishlist_items;
drop policy if exists velora_wishlist_items_self_write on public.wishlist_items;

alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;

create policy velora_wishlist_authenticated_read
on public.wishlists
for select
to authenticated
using (customer_id = (select auth.uid()));

create policy velora_wishlist_items_authenticated_read
on public.wishlist_items
for select
to authenticated
using (
  exists (
    select 1 from public.wishlists w
    where w.id = wishlist_items.wishlist_id
      and w.customer_id = (select auth.uid())
  )
);

revoke insert, update, delete on public.wishlists from anon, authenticated;
revoke insert, update, delete on public.wishlist_items from anon, authenticated;
grant select on public.wishlists, public.wishlist_items to authenticated;

create or replace function public.velora_get_wishlist()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_id', wi.product_id,
        'product_name', p.name,
        'price', p.price,
        'original_price', p.original_price,
        'emoji', p.emoji,
        'images', p.images,
        'rating', p.rating,
        'review_count', p.review_count,
        'category', p.category,
        'subcategory', p.subcategory,
        'brand', p.brand,
        'seller_id', p.seller_id,
        'store_id', p.store_id,
        'store_name', s.name,
        'currency_code', p.currency_code,
        'product_status', p.status::text,
        'saved_at', wi.created_at
      )
      order by wi.created_at desc, wi.id desc
    ),
    '[]'::jsonb
  )
  from public.wishlist_items wi
  join public.wishlists w on w.id = wi.wishlist_id
  join public.products p on p.id = wi.product_id
  left join public.stores s on s.id = p.store_id
  where w.customer_id = (select auth.uid())
    and p.status::text = 'approved';
$function$;

create or replace function public.velora_toggle_wishlist(p_product_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_wishlist_id uuid;
  v_exists boolean := false;
  v_is_favorite boolean := false;
  v_count integer := 0;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  if not exists (
    select 1 from public.products p
    where p.id = p_product_id and p.status::text = 'approved'
  ) then
    raise exception 'PRODUCT_NOT_AVAILABLE';
  end if;

  insert into public.wishlists(customer_id)
  values (v_uid)
  on conflict (customer_id) do nothing
  returning id into v_wishlist_id;

  if v_wishlist_id is null then
    select w.id into v_wishlist_id
    from public.wishlists w
    where w.customer_id = v_uid
    for update;
  end if;

  select exists(
    select 1 from public.wishlist_items wi
    where wi.wishlist_id = v_wishlist_id and wi.product_id = p_product_id
  ) into v_exists;

  if v_exists then
    delete from public.wishlist_items
    where wishlist_id = v_wishlist_id and product_id = p_product_id;
    v_is_favorite := false;
  else
    insert into public.wishlist_items(wishlist_id, product_id)
    values (v_wishlist_id, p_product_id)
    on conflict (wishlist_id, product_id) do nothing;
    v_is_favorite := true;
  end if;

  select count(*)::integer into v_count
  from public.wishlist_items wi
  where wi.wishlist_id = v_wishlist_id;

  return jsonb_build_object('ok',true,'is_favorite',v_is_favorite,'wishlist_count',v_count);
end;
$function$;

create or replace function public.velora_merge_wishlist(p_product_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_wishlist_id uuid;
  v_ids uuid[];
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  if coalesce(array_length(p_product_ids, 1), 0) > 200 then
    raise exception 'WISHLIST_MERGE_LIMIT';
  end if;

  v_ids := coalesce(
    array(
      select distinct x
      from unnest(coalesce(p_product_ids, '{}'::uuid[])) as u(x)
      where x is not null
    ),
    '{}'::uuid[]
  );

  insert into public.wishlists(customer_id)
  values (v_uid)
  on conflict (customer_id) do nothing
  returning id into v_wishlist_id;

  if v_wishlist_id is null then
    select w.id into v_wishlist_id
    from public.wishlists w
    where w.customer_id = v_uid
    for update;
  end if;

  insert into public.wishlist_items(wishlist_id, product_id)
  select v_wishlist_id, p.id
  from public.products p
  where p.id = any(v_ids) and p.status::text = 'approved'
  on conflict (wishlist_id, product_id) do nothing;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'product_id', wi.product_id,
          'product_name', p.name,
          'price', p.price,
          'original_price', p.original_price,
          'emoji', p.emoji,
          'images', p.images,
          'rating', p.rating,
          'review_count', p.review_count,
          'category', p.category,
          'subcategory', p.subcategory,
          'brand', p.brand,
          'seller_id', p.seller_id,
          'store_id', p.store_id,
          'store_name', s.name,
          'currency_code', p.currency_code,
          'product_status', p.status::text,
          'saved_at', wi.created_at
        )
        order by wi.created_at desc, wi.id desc
      )
      from public.wishlist_items wi
      join public.products p on p.id = wi.product_id
      left join public.stores s on s.id = p.store_id
      where wi.wishlist_id = v_wishlist_id and p.status::text = 'approved'
    ),
    '[]'::jsonb
  );
end;
$function$;

revoke execute on function public.velora_get_wishlist() from public;
revoke execute on function public.velora_toggle_wishlist(uuid) from public;
revoke execute on function public.velora_merge_wishlist(uuid[]) from public;
grant execute on function public.velora_get_wishlist() to authenticated;
grant execute on function public.velora_toggle_wishlist(uuid) to authenticated;
grant execute on function public.velora_merge_wishlist(uuid[]) to authenticated;
