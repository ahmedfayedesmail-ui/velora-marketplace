-- Velora Trust & Safety: prevent non-staff support-case reassignment
-- Restore-Test / staging only. Production remains frozen.
--
-- Existing support-case owners may update their own case, but only staff
-- may change assignment fields. This preserves the current ownership model
-- while removing an escalation/hijack path from the SECURITY DEFINER RPC.

create or replace function public.velora_update_support_case(
  p_case_id uuid,
  p_status text default null,
  p_owner_role text default null,
  p_owner_user_id uuid default null,
  p_resolution text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_staff boolean := false;
  v_status text := nullif(lower(trim(p_status)), '');
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_staff := public.velora_is_staff();

  if not v_staff
     and not exists(
       select 1
       from public.support_cases
       where id = p_case_id
         and owner_user_id = v_uid
     )
  then
    raise exception 'FORBIDDEN';
  end if;

  if not v_staff
     and (
       p_owner_role is not null
       or p_owner_user_id is not null
     )
  then
    raise exception 'STAFF_ONLY_OWNER_ASSIGNMENT';
  end if;

  if v_status is not null
     and v_status not in (
       'open','in_progress','waiting_customer',
       'waiting_seller','escalated','resolved','closed'
     )
  then
    raise exception 'INVALID_STATUS';
  end if;

  update public.support_cases
  set status = coalesce(v_status, status),
      owner_role = case
        when v_staff then coalesce(nullif(trim(p_owner_role), ''), owner_role)
        else owner_role
      end,
      owner_user_id = case
        when v_staff then coalesce(p_owner_user_id, owner_user_id)
        else owner_user_id
      end,
      resolved_at = case
        when v_status in ('resolved','closed') then now()
        else resolved_at
      end,
      updated_at = now(),
      source_context = case
        when p_resolution is null then source_context
        else source_context || jsonb_build_object(
          'resolution', left(p_resolution, 2000)
        )
      end
  where id = p_case_id
  returning id into v_id;

  if v_id is null then
    raise exception 'CASE_NOT_FOUND';
  end if;

  insert into public.audit_logs(
    actor_id, action, entity_type, entity_id, metadata
  )
  values(
    v_uid,
    'support_case_updated',
    'support_case',
    v_id,
    jsonb_build_object(
      'status', v_status,
      'owner_role_changed', v_staff and p_owner_role is not null,
      'owner_user_changed', v_staff and p_owner_user_id is not null
    )
  );

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$function$;
