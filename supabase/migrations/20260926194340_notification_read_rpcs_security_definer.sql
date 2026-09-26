-- Notification read RPC hardening.
-- The notifications table is intentionally not directly readable by API roles.
-- These RPCs therefore run as SECURITY DEFINER while enforcing auth.uid()
-- row ownership inside the function.

create or replace function public.velora_get_notifications(
  p_limit integer default 20,
  p_offset integer default 0
)
returns table(
  id uuid,
  type text,
  title text,
  body text,
  entity_type text,
  entity_id uuid,
  is_read boolean,
  created_at timestamptz,
  read_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    n.id,
    n.type,
    n.title,
    n.body,
    n.entity_type,
    n.entity_id,
    n.is_read,
    n.created_at,
    n.read_at
  from public.notifications n
  where (select auth.uid()) is not null
    and n.user_id = (select auth.uid())
  order by n.created_at desc, n.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 100)
  offset greatest(coalesce(p_offset, 0), 0);
$function$;

create or replace function public.velora_get_unread_notification_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $function$
  select count(*)::integer
  from public.notifications n
  where (select auth.uid()) is not null
    and n.user_id = (select auth.uid())
    and n.is_read = false;
$function$;

revoke all on function public.velora_get_notifications(integer,integer) from public, anon, authenticated;
revoke all on function public.velora_get_unread_notification_count() from public, anon, authenticated;

grant execute on function public.velora_get_notifications(integer,integer) to authenticated;
grant execute on function public.velora_get_unread_notification_count() to authenticated;
