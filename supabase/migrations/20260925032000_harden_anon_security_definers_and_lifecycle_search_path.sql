-- Harden the restore-test API surface without changing intended public read APIs.
-- Public anonymous reads retained for catalog, i18n, localized content, FX and commission.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure::text as sig
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE')
      and p.proname not in (
        'velora_get_i18n_catalog',
        'velora_get_localized_content',
        'velora_get_marketplace_catalog',
        'velora_get_commission_rate',
        'velora_get_fx_rate'
      )
  loop
    execute format('revoke execute on function %s from public, anon', r.sig);
  end loop;
end $$;

-- Pin search_path for the private lifecycle helper.
alter function private.velora_lifecycle_interval_days(text)
  set search_path = pg_catalog, public, private;
