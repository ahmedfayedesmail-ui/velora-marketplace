-- Velora S1-D — Layer 1: Beauty Context / Season Engine
-- Restore-Test / staging only. Production remains frozen.

alter table public.products
  add column if not exists seasonal_fit jsonb not null default '{}'::jsonb;

create table if not exists public.beauty_context_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  market_scope text not null default 'EG',
  hemisphere text not null default 'north',
  season text not null,
  month smallint not null check (month between 1 and 12),
  context_date date not null,
  city text,
  source text not null default 'deterministic_calendar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_beauty_context_snapshots_context
  on public.beauty_context_snapshots (context_date, season);

alter table public.beauty_context_snapshots enable row level security;

drop policy if exists beauty_context_self_select on public.beauty_context_snapshots;
create policy beauty_context_self_select
on public.beauty_context_snapshots
for select to authenticated
using (user_id = auth.uid() or public.velora_is_staff());

drop policy if exists beauty_context_self_write on public.beauty_context_snapshots;
create policy beauty_context_self_write
on public.beauty_context_snapshots
for all to authenticated
using (user_id = auth.uid() or public.velora_is_staff())
with check (user_id = auth.uid() or public.velora_is_staff());

create or replace function private.velora_beauty_context()
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_month integer := extract(month from current_date);
  v_season text;
  v_city text;
  v_hemisphere text := 'north';
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
    user_id, market_scope, hemisphere, season, month, context_date,
    city, source, updated_at
  )
  values (
    v_uid, 'EG', v_hemisphere, v_season, v_month::smallint,
    current_date, v_city, 'deterministic_calendar', now()
  )
  on conflict (user_id) do update set
    market_scope = excluded.market_scope,
    hemisphere = excluded.hemisphere,
    season = excluded.season,
    month = excluded.month,
    context_date = excluded.context_date,
    city = excluded.city,
    source = excluded.source,
    updated_at = now();

  return jsonb_build_object(
    'market_scope', 'EG',
    'hemisphere', v_hemisphere,
    'season', v_season,
    'month', v_month,
    'context_date', current_date,
    'city', v_city,
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

-- QA catalog seed: explicit seasonal fit is structured data, not a hidden heuristic.
update public.products
set seasonal_fit = '{"summer":5,"spring":7,"autumn":8,"winter":9}'::jsonb
where id = '24e84d82-e4d8-4c7f-901f-b7bd4b10e29d'; -- treatment

update public.products
set seasonal_fit = '{"summer":6,"spring":8,"autumn":9,"winter":10}'::jsonb
where id = 'b5952eea-8208-4f5e-b43d-dae33406f60a'; -- moisturizer

update public.products
set seasonal_fit = '{"summer":8,"spring":8,"autumn":7,"winter":6}'::jsonb
where id = 'c8a9a765-9071-4704-9213-71b6888e5447'; -- cleanser

update public.products
set seasonal_fit = '{"summer":10,"spring":9,"autumn":8,"winter":7}'::jsonb
where id = '7be01648-06af-4602-9c6e-23f600ea4e0f'; -- SPF

update public.products
set seasonal_fit = '{"summer":8,"spring":9,"autumn":7,"winter":6}'::jsonb
where id = '21d977a0-111b-4bb4-9736-0f2994294d48'; -- vitamin C

