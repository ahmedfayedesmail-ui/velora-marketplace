-- VELORA — Fix canonical Beauty Recommendation V2 public wrapper ACL/runtime
-- Restore-Test only; Production remains frozen.
--
-- The private V2 recommendation operation intentionally remains non-callable
-- by anon/authenticated directly. The public customer API must therefore run
-- as SECURITY DEFINER, while retaining an explicit auth.uid() guard.
-- No new table, column, or second recommendation engine is introduced.

create or replace function public.velora_get_beauty_recommendations()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $function$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception using errcode = '42501', message = 'AUTH_REQUIRED';
  end if;

  return private.velora_beauty_recommendation_operation_v2();
end;
$function$;

revoke all on function public.velora_get_beauty_recommendations() from public;
grant execute on function public.velora_get_beauty_recommendations() to authenticated;
