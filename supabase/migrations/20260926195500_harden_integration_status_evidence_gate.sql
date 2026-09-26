-- VELORA — evidence-gate integration status transitions
-- READY is a claim that must be backed by the integration's configured
-- credentials. Webhook integrations also require signature verification.
-- Every status change is recorded in audit_logs.

create or replace function public.velora_set_integration_status(p_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r public.integration_control_plane;
  v_uid uuid := auth.uid();
  v_old_status text;
begin
  if v_uid is null or not public.velora_is_staff() then
    raise exception 'forbidden';
  end if;

  if p_status not in ('pending','ready','degraded','blocked') then
    raise exception 'invalid status';
  end if;

  select status
    into v_old_status
  from public.integration_control_plane
  where id = p_id
  for update;

  if not found then
    raise exception 'integration not found';
  end if;

  if p_status = 'ready' then
    select *
      into r
    from public.integration_control_plane
    where id = p_id;

    if not r.credentials_configured then
      raise exception 'INTEGRATION_CREDENTIALS_NOT_VERIFIED';
    end if;

    if r.integration_type = 'webhook'
       and not r.webhook_signature_verified then
      raise exception 'WEBHOOK_SIGNATURE_NOT_VERIFIED';
    end if;
  end if;

  update public.integration_control_plane
  set status = p_status,
      updated_at = now(),
      last_health_at = case
        when p_status in ('ready','degraded','blocked') then now()
        else last_health_at
      end
  where id = p_id
  returning * into r;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(
    v_uid,
    'integration_status_changed',
    'integration',
    r.id,
    jsonb_build_object(
      'integration_key',r.integration_key,
      'old_status',v_old_status,
      'new_status',r.status,
      'environment',r.environment,
      'integration_type',r.integration_type,
      'credentials_configured',r.credentials_configured,
      'webhook_signature_verified',r.webhook_signature_verified
    )
  );

  return to_jsonb(r);
end;
$function$;
