-- Do not reassign an existing push endpoint to a different user.
create or replace function public.velora_register_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_existing_user uuid;
  v_endpoint text := nullif(btrim(coalesce(p_endpoint,'')),'');
  v_p256dh text := nullif(btrim(coalesce(p_p256dh,'')),'');
  v_auth text := nullif(btrim(coalesce(p_auth,'')),'');
  v_ua text := nullif(btrim(coalesce(p_user_agent,'')),'');
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if v_endpoint is null
     or length(v_endpoint) > 4000
     or v_p256dh is null
     or v_auth is null
  then
    raise exception 'INVALID_PUSH_SUBSCRIPTION';
  end if;

  select user_id
    into v_existing_user
  from public.push_subscriptions
  where endpoint = v_endpoint
  for update;

  if v_existing_user is not null
     and v_existing_user is distinct from v_uid
  then
    raise exception 'PUSH_ENDPOINT_OWNERSHIP_CONFLICT';
  end if;

  insert into public.push_subscriptions(
    user_id,endpoint,p256dh,auth,user_agent,active,updated_at,last_seen_at
  )
  values(
    v_uid,v_endpoint,v_p256dh,v_auth,v_ua,true,now(),now()
  )
  on conflict (endpoint) do update set
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
