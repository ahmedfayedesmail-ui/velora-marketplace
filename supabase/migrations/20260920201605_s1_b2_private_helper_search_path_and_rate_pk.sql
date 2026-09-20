-- B2 hardening: stabilize private helper search_path and key the internal rate ledger.

create or replace function private.beauty_norm_text(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog, private
as $$
  select lower(trim(coalesce(p_value, '')));
$$;

create or replace function private.beauty_match_array(p_needle text, p_values jsonb)
returns boolean
language sql
immutable
set search_path = pg_catalog, private
as $$
  select p_needle is not null
     and private.beauty_norm_text(p_needle) <> ''
     and exists (
       select 1
       from jsonb_array_elements_text(coalesce(p_values, '[]'::jsonb)) e(value)
       where private.beauty_norm_text(e.value) = private.beauty_norm_text(p_needle)
     );
$$;

create or replace function private.beauty_match_scalar(p_needle text, p_value text)
returns boolean
language sql
immutable
set search_path = pg_catalog, private
as $$
  select p_needle is not null
     and private.beauty_norm_text(p_needle) <> ''
     and private.beauty_norm_text(p_value) = private.beauty_norm_text(p_needle);
$$;

create or replace function private.beauty_match_object(p_needle text, p_object jsonb)
returns boolean
language sql
immutable
set search_path = pg_catalog, private
as $$
  select p_needle is not null
     and private.beauty_norm_text(p_needle) <> ''
     and exists (
       select 1
       from jsonb_each_text(coalesce(p_object, '{}'::jsonb)) e(key, value)
       where private.beauty_norm_text(e.value) = private.beauty_norm_text(p_needle)
     );
$$;

alter table private.beauty_recommendation_rate_events
  add column id bigint generated always as identity;

alter table private.beauty_recommendation_rate_events
  add primary key (id);
