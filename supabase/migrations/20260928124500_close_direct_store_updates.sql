-- Store mutations are governed by canonical RPCs.
-- The legacy table UPDATE path allowed owners to alter sensitive country/currency fields directly.
drop policy if exists velora_store_update on public.stores;
revoke update on public.stores from authenticated;
