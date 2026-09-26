-- VELORA — protect privileged staff targets from lower-level account actions
-- Keep the existing account-action workflow and audit trail, but enforce
-- hierarchy: only an owner may act on an admin/owner target.

create or replace function private.velora_account_action(
  p_user_id uuid,
  p_action_type text,
  p_reason text,
  p_duration_hours integer default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_until timestamptz;
  v_actor_is_owner boolean;
  v_target_is_privileged boolean;
begin
  if not public.velora_is_staff() then
    raise exception 'STAFF_ONLY';
  end if;

  if p_user_id is null or p_action_type is null then
    raise exception 'INVALID_INPUT';
  end if;

  if p_action_type not in ('warn','suspend','ban','unban','restore') then
    raise exception 'INVALID_ACTION';
  end if;

  if p_duration_hours is not null and p_duration_hours <= 0 then
    raise exception 'INVALID_DURATION';
  end if;

  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'owner'
  )
  into v_actor_is_owner;

  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = p_user_id
      and ur.role in ('admin','owner')
  )
  into v_target_is_privileged;

  if v_target_is_privileged and not v_actor_is_owner then
    raise exception 'PRIVILEGED_TARGET_REQUIRES_OWNER';
  end if;

  v_until := case
    when p_duration_hours is null then null
    else now() + make_interval(hours => p_duration_hours)
  end;

  if p_action_type='suspend' then
    update public.profiles
    set status='suspended', updated_at=now()
    where id=p_user_id;
  elsif p_action_type='ban' then
    update public.profiles
    set status='blocked', updated_at=now()
    where id=p_user_id;
  elsif p_action_type in ('unban','restore') then
    update public.profiles
    set status='active', updated_at=now()
    where id=p_user_id;
  end if;

  insert into public.account_actions(
    user_id,action_type,reason,actor_id,starts_at,ends_at,metadata
  )
  values(
    p_user_id,p_action_type,p_reason,auth.uid(),now(),v_until,
    coalesce(p_metadata,'{}'::jsonb)
  );

  insert into public.audit_logs(
    actor_id,action,entity_type,entity_id,metadata
  )
  values(
    auth.uid(),
    'account_'||p_action_type,
    'profile',
    p_user_id,
    jsonb_build_object(
      'reason',p_reason,
      'duration_hours',p_duration_hours,
      'metadata',coalesce(p_metadata,'{}'::jsonb),
      'actor_is_owner',v_actor_is_owner,
      'target_is_privileged',v_target_is_privileged
    )
  );

  return jsonb_build_object(
    'ok',true,
    'user_id',p_user_id,
    'action',p_action_type,
    'ends_at',v_until
  );
end;
$function$;
