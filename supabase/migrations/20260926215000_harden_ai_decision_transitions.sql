-- VELORA — harden AI decision state transitions and audit evidence
-- AI signals explicitly require human approval by default. Execution must never
-- jump directly from proposed/rejected/expired states.
create or replace function public.velora_update_ai_decision(
  p_signal_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r public.ai_decision_signals%rowtype;
  v_old_status text;
  v_new_status text := lower(trim(coalesce(p_status,'')));
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not public.velora_is_staff() then
    raise exception 'staff access required';
  end if;

  if v_new_status not in ('approved','rejected','executed','expired') then
    raise exception 'invalid decision status';
  end if;

  select *
    into r
  from public.ai_decision_signals
  where id=p_signal_id
  for update;

  if not found then
    raise exception 'signal not found';
  end if;

  v_old_status := r.status::text;

  if v_old_status = v_new_status then
    return jsonb_build_object(
      'id',r.id,
      'status',v_old_status,
      'reviewed_at',r.reviewed_at,
      'unchanged',true
    );
  end if;

  if not (
       (v_old_status='proposed' and v_new_status in ('approved','rejected','expired'))
    or (v_old_status='approved' and v_new_status in ('executed','expired','rejected'))
  ) then
    raise exception 'INVALID_AI_DECISION_TRANSITION'
      using detail = format(
        'Transition %s -> %s is not allowed',
        v_old_status,
        v_new_status
      );
  end if;

  if v_new_status='executed'
     and coalesce(r.requires_human_approval,true)
     and v_old_status<>'approved' then
    raise exception 'HUMAN_APPROVAL_REQUIRED';
  end if;

  update public.ai_decision_signals
  set status=v_new_status,
      reviewed_by=v_uid,
      reviewed_at=now(),
      updated_at=now()
  where id=r.id
  returning * into r;

  insert into public.audit_logs(
    actor_id,action,entity_type,entity_id,metadata
  )
  values(
    v_uid,
    'ai_decision_status_changed',
    'ai_decision_signal',
    r.id,
    jsonb_build_object(
      'from',v_old_status,
      'to',v_new_status,
      'signal_code',r.signal_code,
      'requires_human_approval',r.requires_human_approval,
      'evidence',r.evidence
    )
  );

  return jsonb_build_object(
    'id',r.id,
    'status',r.status,
    'reviewed_at',r.reviewed_at,
    'unchanged',false
  );
end;
$function$;
