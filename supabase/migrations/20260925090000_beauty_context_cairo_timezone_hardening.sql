-- Velora S1-D hardening: Egypt-local calendar season context.
-- Restore-Test / staging migration. Production remains frozen.

alter table public.beauty_context_snapshots
  add column if not exists time_zone text not null default 'Africa/Cairo';

alter table public.beauty_context_snapshots
  add column if not exists season_basis text not null default 'meteorological_calendar';

update public.beauty_context_snapshots
set time_zone = 'Africa/Cairo',
    season_basis = 'meteorological_calendar'
where time_zone is null
   or season_basis is null;

drop policy if exists beauty_context_self_write on public.beauty_context_snapshots;

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
  v_season text;
  v_city text;
  v_hemisphere text := 'north';
  v_season_basis text := 'meteorological_calendar';
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  v_season := case
    when v_month in (12,1,2) then 'winter'
    when v_month in (3,4,5) then 'spring'
    when v_month in (6,7,8) then 'summer'
    when v_month in (9,10,11) then 'autumn'
    else 'unknown'
  end;

  select o.customer_city
    into v_city
  from public.orders o
  where o.customer_id = v_uid
    and nullif(btrim(o.customer_city), '') is not null
  order by o.created_at desc
  limit 1;

  insert into public.beauty_context_snapshots (
    user_id,
    market_scope,
    hemisphere,
    season,
    month,
    context_date,
    city,
    source,
    time_zone,
    season_basis,
    updated_at
  )
  values (
    v_uid,
    'EG',
    v_hemisphere,
    v_season,
    v_month::smallint,
    v_context_date,
    v_city,
    'deterministic_calendar',
    v_time_zone,
    v_season_basis,
    now()
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

create or replace function public.velora_get_beauty_context()
returns jsonb
language plpgsql
security invoker
set search_path to 'public','private','extensions','pg_catalog'
as $function$
begin
  return private.velora_beauty_context();
end;
$function$;

revoke all on function public.velora_get_beauty_context() from public;
grant execute on function public.velora_get_beauty_context() to authenticated;

do $patch$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'velora_beauty_routine_operation'
    and p.pronargs = 0
  order by p.oid desc
  limit 1;

  if v_def is null then
    raise exception 'ROUTINE_OPERATION_NOT_FOUND';
  end if;

  v_def := replace(
    v_def,
    '''context_version'', ''beauty-context.v1''',
    '''context_version'', ''beauty-context.v2'''
  );

  if position('''context_version'', ''beauty-context.v2''' in v_def) = 0 then
    raise exception 'ROUTINE_CONTEXT_VERSION_PATCH_FAILED';
  end if;

  execute v_def;
end
$patch$;

do $patch$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'velora_get_current_beauty_routine'
    and p.pronargs = 0
  order by p.oid desc
  limit 1;

  if v_def is null then
    raise exception 'CURRENT_ROUTINE_NOT_FOUND';
  end if;

  v_def := replace(
    v_def,
    '''context_version'', ''beauty-context.v1''',
    '''context_version'', ''beauty-context.v2'''
  );

  if position('''context_version'', ''beauty-context.v2''' in v_def) = 0 then
    raise exception 'CURRENT_ROUTINE_CONTEXT_VERSION_PATCH_FAILED';
  end if;

  execute v_def;
end
$patch$;
