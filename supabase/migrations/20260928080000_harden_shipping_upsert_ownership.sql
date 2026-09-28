-- Prevent cross-store mutation through caller-supplied existing zone/rate IDs.
create or replace function public.velora_upsert_store_shipping_zone(
  p_zone_id uuid,
  p_store_id uuid,
  p_name text,
  p_country_code text,
  p_is_active boolean default true
)
returns public.store_shipping_zones
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
  v_row public.store_shipping_zones%rowtype;
  v_country text := nullif(upper(trim(coalesce(p_country_code,''))),'');
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_store_id is null or nullif(trim(coalesce(p_name,'')),'') is null then
    raise exception 'SHIPPING_ZONE_REQUIRED';
  end if;
  if v_country is null or length(v_country)<>2 then
    raise exception 'INVALID_COUNTRY_CODE';
  end if;

  if not exists(
    select 1
    from public.stores s
    where s.id=p_store_id
      and (public.velora_is_staff() or s.owner_id=v_uid)
  ) then
    raise exception 'FORBIDDEN';
  end if;

  if p_zone_id is not null
     and exists(
       select 1
       from public.store_shipping_zones z
       where z.id=p_zone_id
         and z.store_id is distinct from p_store_id
     ) then
    raise exception 'FORBIDDEN';
  end if;

  insert into public.store_shipping_zones(
    id,store_id,name,country_code,is_active,created_at,updated_at
  )
  values(
    coalesce(p_zone_id,gen_random_uuid()),p_store_id,trim(p_name),v_country,p_is_active,now(),now()
  )
  on conflict(id) do update set
    name=excluded.name,
    country_code=excluded.country_code,
    is_active=excluded.is_active,
    updated_at=now()
  returning * into v_row;

  return v_row;
end;
$function$;

create or replace function public.velora_upsert_store_shipping_rate(
  p_rate_id uuid,
  p_zone_id uuid,
  p_carrier_code text,
  p_service_name text,
  p_price numeric,
  p_currency_code text,
  p_estimated_days_min smallint default null,
  p_estimated_days_max smallint default null,
  p_free_shipping_threshold numeric default null,
  p_is_active boolean default true
)
returns public.store_shipping_rates
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
  v_row public.store_shipping_rates%rowtype;
  v_code text := lower(trim(coalesce(p_carrier_code,'')));
  v_currency text := upper(trim(coalesce(p_currency_code,'')));
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;

  if not exists(
    select 1
    from public.store_shipping_zones z
    join public.stores s on s.id=z.store_id
    where z.id=p_zone_id
      and (public.velora_is_staff() or s.owner_id=v_uid)
  ) then
    raise exception 'FORBIDDEN';
  end if;

  if p_rate_id is not null
     and exists(
       select 1
       from public.store_shipping_rates r
       where r.id=p_rate_id
         and r.zone_id is distinct from p_zone_id
     ) then
    raise exception 'FORBIDDEN';
  end if;

  if not exists(
    select 1
    from public.shipping_carriers
    where code=v_code and is_active=true
  ) then
    raise exception 'CARRIER_NOT_ACTIVE';
  end if;

  if nullif(trim(p_service_name),'') is null then
    raise exception 'SERVICE_NAME_REQUIRED';
  end if;
  if p_price is null or p_price<0 then
    raise exception 'INVALID_SHIPPING_PRICE';
  end if;
  if not exists(
    select 1 from public.currencies where code=v_currency and is_active=true
  ) then
    raise exception 'INVALID_SHIPPING_CURRENCY';
  end if;
  if p_estimated_days_min is not null and p_estimated_days_min<0 then raise exception 'INVALID_ESTIMATE'; end if;
  if p_estimated_days_max is not null and p_estimated_days_max<0 then raise exception 'INVALID_ESTIMATE'; end if;
  if p_estimated_days_min is not null and p_estimated_days_max is not null
     and p_estimated_days_max<p_estimated_days_min then
    raise exception 'INVALID_ESTIMATE';
  end if;
  if p_free_shipping_threshold is not null and p_free_shipping_threshold<0 then
    raise exception 'INVALID_FREE_SHIPPING_THRESHOLD';
  end if;

  insert into public.store_shipping_rates(
    id,zone_id,carrier_code,service_name,price,currency_code,
    estimated_days_min,estimated_days_max,free_shipping_threshold,is_active,created_at,updated_at
  )
  values(
    coalesce(p_rate_id,gen_random_uuid()),p_zone_id,v_code,trim(p_service_name),p_price,v_currency,
    p_estimated_days_min,p_estimated_days_max,p_free_shipping_threshold,p_is_active,now(),now()
  )
  on conflict(id) do update set
    carrier_code=excluded.carrier_code,
    service_name=excluded.service_name,
    price=excluded.price,
    currency_code=excluded.currency_code,
    estimated_days_min=excluded.estimated_days_min,
    estimated_days_max=excluded.estimated_days_max,
    free_shipping_threshold=excluded.free_shipping_threshold,
    is_active=excluded.is_active,
    updated_at=now()
  returning * into v_row;

  return v_row;
end;
$function$;
