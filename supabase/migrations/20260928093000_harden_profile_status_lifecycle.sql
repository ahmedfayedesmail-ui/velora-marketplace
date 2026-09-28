-- Protect account lifecycle status from self-service profile updates.
-- Staff account-action workflows remain allowed.
create or replace function private.velora_guard_profile_status_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  if public.velora_is_staff() then
    return new;
  end if;

  if new.status is distinct from old.status then
    raise exception 'PROFILE_STATUS_CHANGE_REQUIRES_STAFF';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_velora_guard_profile_status_mutation on public.profiles;
create trigger trg_velora_guard_profile_status_mutation
before update on public.profiles
for each row
execute function private.velora_guard_profile_status_mutation();

-- Do not reactivate an existing suspended/blocked profile during profile hydration.
create or replace function public.velora_ensure_own_profile(p_name text, p_phone text default null)
returns public.users
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_user public.users%rowtype;
  v_auth_email text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select email into v_auth_email from auth.users where id = auth.uid();

  if v_auth_email is null or btrim(v_auth_email) = '' then
    raise exception 'AUTH_EMAIL_REQUIRED';
  end if;

  insert into public.profiles (
    id, full_name, email, country_code, preferred_language, preferred_currency, status
  )
  values (
    auth.uid(), nullif(btrim(p_name), ''), lower(btrim(v_auth_email)),
    'EG', 'en', 'EGP', 'active'
  )
  on conflict (id) do update
  set full_name = coalesce(nullif(btrim(p_name), ''), profiles.full_name),
      email = lower(btrim(v_auth_email)),
      updated_at = now();

  select * into v_user
  from public.users
  where id = auth.uid()
  for update;

  if not found then
    insert into public.users(id, name, email, phone, role, status)
    values (
      auth.uid(), nullif(btrim(p_name), ''), lower(btrim(v_auth_email)),
      nullif(btrim(p_phone), ''), 'customer', 'active'
    )
    returning * into v_user;
  else
    update public.users
       set name = coalesce(nullif(btrim(p_name), ''), name),
           email = lower(btrim(v_auth_email)),
           phone = coalesce(nullif(btrim(p_phone), ''), phone),
           updated_at = now()
     where id = auth.uid()
     returning * into v_user;
  end if;

  insert into public.user_roles(user_id, role)
  values (auth.uid(), 'customer')
  on conflict (user_id, role) do nothing;

  return v_user;
end;
$function$;
