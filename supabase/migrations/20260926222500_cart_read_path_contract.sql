-- VELORA — restore authenticated canonical cart read path
-- Production remains FROZEN.
--
-- Checkout and cart sync already use the authenticated user's own
-- carts/cart_items rows as their canonical read source. RLS was enabled
-- on these tables, but no SELECT policy existed, so browser sync could
-- not read the canonical cart and silently fell back to legacy STATE.cart.

drop policy if exists carts_read_own on public.carts;
create policy carts_read_own
  on public.carts
  for select
  to authenticated
  using ((select auth.uid()) = customer_id);

drop policy if exists cart_items_read_own on public.cart_items;
create policy cart_items_read_own
  on public.cart_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_items.cart_id
        and c.customer_id = (select auth.uid())
    )
  );
