-- Velora S1-D — Mobile Push Notifications foundation
-- Restore-Test / staging only. Production remains frozen.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_active
  on public.push_subscriptions(user_id, active);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_self_select on public.push_subscriptions;
create policy push_subscriptions_self_select
on public.push_subscriptions
for select to authenticated
using (user_id = auth.uid() or public.velora_is_staff());

drop policy if exists push_subscriptions_self_delete on public.push_subscriptions;
create policy push_subscriptions_self_delete
on public.push_subscriptions
for delete to authenticated
using (user_id = auth.uid());

create table if not exists public.notification_push_deliveries (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  delivered_at timestamptz not null default now(),
  primary key (notification_id, subscription_id)
);

create index if not exists idx_notification_push_deliveries_subscription
  on public.notification_push_deliveries(subscription_id, delivered_at desc);

alter table public.notification_push_deliveries enable row level security;

drop policy if exists notification_push_deliveries_self_select
  on public.notification_push_deliveries;
create policy notification_push_deliveries_self_select
on public.notification_push_deliveries
for select to authenticated
using (
  exists (
    select 1
    from public.push_subscriptions ps
    where ps.id = subscription_id
      and (ps.user_id = auth.uid() or public.velora_is_staff())
  )
);

create or replace function public.velora_register_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if nullif(btrim(p_endpoint),'') is null
     or length(p_endpoint) > 4000
     or nullif(btrim(p_p256dh),'') is null
     or nullif(btrim(p_auth),'') is null
  then
    raise exception 'INVALID_PUSH_SUBSCRIPTION';
  end if;

  insert into public.push_subscriptions(
    user_id, endpoint, p256dh, auth, user_agent, active, updated_at, last_seen_at
  )
  values(
    v_uid, btrim(p_endpoint), btrim(p_p256dh), btrim(p_auth),
    nullif(btrim(p_user_agent),''), true, now(), now()
  )
  on conflict (endpoint) do update set
    user_id = excluded.user_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    user_agent = excluded.user_agent,
    active = true,
    updated_at = now(),
    last_seen_at = now()
  returning id into v_id;

  return v_id;
end;
$function$;

create or replace function public.velora_unregister_push_subscription(
  p_endpoint text
)
returns boolean
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  update public.push_subscriptions
  set active = false,
      updated_at = now()
  where user_id = v_uid
    and endpoint = btrim(p_endpoint);

  return found;
end;
$function$;

create or replace function public.velora_mark_push_delivery(
  p_notification_id uuid,
  p_subscription_id uuid
)
returns boolean
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
begin
  insert into public.notification_push_deliveries(notification_id, subscription_id)
  values(p_notification_id, p_subscription_id)
  on conflict do nothing;

  return found;
end;
$function$;

revoke all on function public.velora_register_push_subscription(text,text,text,text) from public;
grant execute on function public.velora_register_push_subscription(text,text,text,text) to authenticated;

revoke all on function public.velora_unregister_push_subscription(text) from public;
grant execute on function public.velora_unregister_push_subscription(text) to authenticated;

revoke all on function public.velora_mark_push_delivery(uuid,uuid) from public;
grant execute on function public.velora_mark_push_delivery(uuid,uuid) to service_role;

-- Service-role-only cleanup helpers used by the serverless delivery worker.
create or replace function public.velora_remove_push_subscription(p_subscription_id uuid)
returns boolean
language sql
security definer
set search_path to 'public','pg_catalog'
as $function$
  update public.push_subscriptions
  set active=false, updated_at=now()
  where id=p_subscription_id
  returning true;
$function$;

create or replace function public.velora_unmark_push_delivery(
  p_notification_id uuid,
  p_subscription_id uuid
)
returns boolean
language sql
security definer
set search_path to 'public','pg_catalog'
as $function$
  delete from public.notification_push_deliveries
  where notification_id=p_notification_id
    and subscription_id=p_subscription_id
  returning true;
$function$;

revoke all on function public.velora_remove_push_subscription(uuid) from public;
grant execute on function public.velora_remove_push_subscription(uuid) to service_role;

revoke all on function public.velora_unmark_push_delivery(uuid,uuid) from public;
grant execute on function public.velora_unmark_push_delivery(uuid,uuid) to service_role;

