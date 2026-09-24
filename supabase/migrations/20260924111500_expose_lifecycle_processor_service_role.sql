-- Expose lifecycle processor only to server-side service_role.
create or replace function public.velora_process_notification_lifecycle(
  p_limit integer default 100
)
returns integer
language sql
security definer
set search_path to 'public','private','pg_catalog'
as $function$
  select private.velora_process_notification_lifecycle(p_limit);
$function$;

revoke all on function public.velora_process_notification_lifecycle(integer) from public;
grant execute on function public.velora_process_notification_lifecycle(integer) to service_role;

