-- Restore-Test: marketplace catalog is a public read surface only.
revoke all on table public.velora_marketplace_catalog from anon;
revoke all on table public.velora_marketplace_catalog from authenticated;

grant select on table public.velora_marketplace_catalog to anon;
grant select on table public.velora_marketplace_catalog to authenticated;
