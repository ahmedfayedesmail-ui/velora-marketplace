-- Velora S1-D hardening: explicit Egypt-local calendar season helper.
-- Restore-Test / staging migration. Production remains frozen.

create or replace function private.beauty_season_for_date(p_date date)
returns text
language sql
immutable
set search_path to 'pg_catalog'
as $function$
  select case extract(month from p_date)::int
    when 12 then 'winter'
    when 1 then 'winter'
    when 2 then 'winter'
    when 3 then 'spring'
    when 4 then 'spring'
    when 5 then 'spring'
    when 6 then 'summer'
    when 7 then 'summer'
    when 8 then 'summer'
    when 9 then 'autumn'
    when 10 then 'autumn'
    when 11 then 'autumn'
    else 'unknown'
  end;
$function$;

revoke all on function private.beauty_season_for_date(date) from public;

create or replace function private.velora_beauty_context()
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_time_zone text := 'Africa/Cairo';
  v_local_ts timestamp := (now() at time zone 'Africa/Cairo');
  v_context_date date := v_local_ts::date;
  v_month integer := extract(month from v_local_ts);
  v_season text := private.beauty_season_for_date(v_local_ts::date);
  v_city text;
  v_hemisphere text := 'north';
  v_season_basis text := 'meteorological_calendar';
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  select o.customer_city
    into v_city
  from public.orders o
  where o.customer_id = v_uid
    and nullif(btrim(o.customer_city), '') is not null
  order by o.created_at desc
  limit 1;

  insert into public.beauty_context_snapshots (
    user_id, market_scope, hemisphere, season, month, context_date,
    city, source, time_zone, season_basis, updated_at
  )
  values (
    v_uid, 'EG', v_hemisphere, v_season, v_month::smallint, v_context_date,
    v_city, 'deterministic_calendar', v_time_zone, v_season_basis, now()
  )
  on conflict (user_id) do update set
    market_scope = excluded.market_scope,
    hemisphere = excluded.hemisphere,
    season = excluded.season,
    month = excluded.month,
    context_date = excluded.context_date,
    city = excluded.city,
    source = excluded.source,
    time_zone = excluded.time_zone,
    season_basis = excluded.season_basis,
    updated_at = now();

  return jsonb_build_object(
    'market_scope', 'EG',
    'hemisphere', v_hemisphere,
    'season', v_season,
    'month', v_month,
    'context_date', v_context_date,
    'city', v_city,
    'time_zone', v_time_zone,
    'season_basis', v_season_basis,
    'local_time', to_char(v_local_ts, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'source', 'deterministic_calendar'
  );
end;
$function$;

revoke all on function private.velora_beauty_context() from public;
