-- Rollback S2-C review RLS policy consolidation.
drop policy if exists velora_reviews_anon_published_read on public.reviews;
drop policy if exists velora_reviews_authenticated_read on public.reviews;

create policy velora_reviews_public_read
on public.reviews
for select
to anon,authenticated
using (status='published');

create policy velora_reviews_owner_read
on public.reviews
for select
to authenticated
using (
  customer_id=(select auth.uid())
  or (select public.velora_is_staff())
);

create policy velora_reviews_seller_read
on public.reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.products p
    join public.sellers s on s.id=p.seller_id
    where p.id=reviews.product_id
      and s.user_id=(select auth.uid())
  )
);
