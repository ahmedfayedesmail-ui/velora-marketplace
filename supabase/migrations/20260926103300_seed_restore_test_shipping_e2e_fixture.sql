-- Restore-Test only: provide a governed shipping fixture for the approved E2E seller.
-- No production data or schema is changed by this migration.
do $$
declare
  v_store uuid;
  v_zone uuid;
begin
  select id into v_store
  from public.stores
  where name='E2E Seller Store'
    and status='approved'
  order by created_at desc
  limit 1;

  if v_store is null then
    raise exception 'E2E_SELLER_STORE_NOT_FOUND';
  end if;

  select id into v_zone
  from public.store_shipping_zones
  where store_id=v_store
    and upper(country_code)='EG'
  order by created_at desc
  limit 1;

  if v_zone is null then
    insert into public.store_shipping_zones(store_id,name,country_code,is_active)
    values(v_store,'Egypt — E2E Test Zone','EG',true)
    returning id into v_zone;
  end if;

  if not exists (
    select 1
    from public.store_shipping_rates
    where zone_id=v_zone
      and carrier_code='velora_manual'
      and upper(currency_code)='EGP'
      and is_active=true
  ) then
    insert into public.store_shipping_rates(
      zone_id,carrier_code,service_name,price,currency_code,
      estimated_days_min,estimated_days_max,free_shipping_threshold,is_active
    )
    values(v_zone,'velora_manual','Velora Manual E2E',30,'EGP',2,5,null,true);
  end if;

  insert into public.country_shipping_availability(country_code,carrier_code,is_enabled)
  values('EG','velora_manual',true)
  on conflict (country_code,carrier_code)
  do update set is_enabled=excluded.is_enabled;
end $$;
