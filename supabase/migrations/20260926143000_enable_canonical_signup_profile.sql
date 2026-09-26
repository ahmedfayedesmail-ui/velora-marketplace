-- Restore-Test / staging only. Production remains frozen.
-- Canonical signup support: create the authenticated user's public profile
-- through a SECURITY DEFINER RPC because public.users has no INSERT policy.
create or replace function public.velora_ensure_own_profile(
  p_name text,
  p_phone text default null
)
returns public.users
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_user public.users%rowtype;
  v_auth_email text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select email
    into v_auth_email
  from auth.users
  where id = auth.uid();

  if v_auth_email is null or btrim(v_auth_email) = '' then
    raise exception 'AUTH_EMAIL_REQUIRED';
  end if;

  select *
    into v_user
  from public.users
  where id = auth.uid()
  for update;

  if not found then
    insert into public.users(id, name, email, phone, role, status)
    values (
      auth.uid(),
      nullif(btrim(p_name), ''),
      lower(btrim(v_auth_email)),
      nullif(btrim(p_phone), ''),
      'customer',
      'active'
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
  on conflict (user_id) do nothing;

  return v_user;
end;
$$;

revoke all on function public.velora_ensure_own_profile(text,text) from public;
grant execute on function public.velora_ensure_own_profile(text,text) to authenticated;
