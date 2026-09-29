-- Velora Restore-Test only.
-- Legacy Store Profile remains a compatibility entry point, but must not
-- bypass the canonical Seller re-review contract. Delegate to the canonical
-- seller profile writer so one policy/ownership/audit path remains authoritative.

create or replace function public.velora_update_owned_store_profile(
  p_store_id uuid,
  p_store_name text,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_uid uuid := auth.uid();
  v_seller_id uuid;
  v_store_status text;
  v_result jsonb;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_store_id is null then raise exception 'STORE_REQUIRED'; end if;

  select st.status::text
    into v_store_status
  from public.stores st
  where st.id=p_store_id
    and st.owner_id=v_uid
  for update;

  if not found then
    raise exception 'NOT_STORE_OWNER';
  end if;

  if v_store_status<>'approved' then
    raise exception 'STORE_NOT_APPROVED';
  end if;

  if p_store_name is null
     or length(trim(p_store_name))<3
     or length(trim(p_store_name))>200 then
    raise exception 'INVALID_STORE_NAME';
  end if;

  if p_description is not null and length(p_description)>4000 then
    raise exception 'INVALID_STORE_DESCRIPTION';
  end if;

  select s.id
    into v_seller_id
  from public.sellers s
  where s.user_id=v_uid
  order by s.created_at desc
  limit 1;

  if v_seller_id is null then
    raise exception 'SELLER_NOT_FOUND';
  end if;

  v_result:=public.velora_update_seller_profile(
    v_seller_id,
    p_store_name,
    null,
    p_description,
    null,
    null,
    null,
    null
  );

  return v_result
    || jsonb_build_object(
      'store_id',p_store_id,
      'legacy_adapter',true,
      'canonical_profile_writer','velora_update_seller_profile'
    );
end;
$function$;
