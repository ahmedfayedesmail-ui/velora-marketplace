create or replace function public.velora_update_owned_store_profile(
  p_store_id uuid,
  p_store_name text,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_uid uuid := auth.uid();
  v_row public.stores%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_store_id is null then
    raise exception 'STORE_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.stores
    where id = p_store_id
      and owner_id = v_uid
      and status = 'approved'
  ) then
    raise exception 'NOT_STORE_OWNER';
  end if;

  if p_store_name is null or length(trim(p_store_name)) < 3 or length(trim(p_store_name)) > 200 then
    raise exception 'INVALID_STORE_NAME';
  end if;

  if p_description is not null and length(p_description) > 4000 then
    raise exception 'INVALID_STORE_DESCRIPTION';
  end if;

  update public.stores
  set name = trim(p_store_name),
      description = case
        when p_description is null then description
        else p_description
      end,
      updated_at = now()
  where id = p_store_id
    and owner_id = v_uid
    and status = 'approved'
  returning * into v_row;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values(
    v_uid,
    'seller_store_profile_updated',
    'store',
    v_row.id,
    jsonb_build_object(
      'seller_store_sync', true,
      'store_name', v_row.name
    )
  );

  return jsonb_build_object(
    'ok', true,
    'store_id', v_row.id,
    'name', v_row.name,
    'description', v_row.description
  );
end;
$function$;

revoke all on function public.velora_update_owned_store_profile(uuid,text,text) from public;
revoke all on function public.velora_update_owned_store_profile(uuid,text,text) from anon;
grant execute on function public.velora_update_owned_store_profile(uuid,text,text) to authenticated;