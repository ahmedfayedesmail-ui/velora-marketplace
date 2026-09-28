-- Velora Message 3/11: remove the stale seller hard-delete contract.
-- Production is frozen; this applies only to the current Restore-Test environment.
drop policy if exists seller_delete_own_products on public.products;
revoke delete on table public.products from authenticated;
revoke delete on table public.products from anon;
