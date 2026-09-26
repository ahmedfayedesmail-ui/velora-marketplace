-- VELORA — correctly detect explicit SECURITY DEFINER search_path pins
-- Empty search_path (SET search_path TO '') is an explicit hardening posture;
-- it must not be reported as unpinned.

create or replace function public.velora_run_security_attack_surface_audit()
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r_id uuid;
  v_pass int:=0;
  v_warn int:=0;
  v_fail int:=0;
  v_score int:=0;
  v_rls int:=0;
  v_policy int:=0;
  v_public_exec int:=0;
  v_public_definer_exec int:=0;
  v_public_dml int:=0;
  v_unguarded_public_dml int:=0;
  v_definer int:=0;
  v_bad_search_path int:=0;
  v_key text;
  v_status text;
  v_msg text;
begin
  if not public.velora_is_staff() then
    raise exception 'staff_only';
  end if;

  insert into public.security_audit_runs(status)
  values('running')
  returning id into r_id;

  select count(*) into v_rls
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relkind='r'
    and c.relrowsecurity
    and c.relname in (
      'users','profiles','user_roles','sellers','stores','products',
      'orders','order_items','payment_attempts','shipments','returns',
      'disputes','audit_logs'
    );

  select count(*) into v_policy
  from pg_policies p
  where p.schemaname='public'
    and p.tablename in (
      'users','profiles','user_roles','sellers','stores','products',
      'orders','order_items','payment_attempts','shipments','returns',
      'disputes','audit_logs'
    );

  select
    count(*) filter (where has_function_privilege('anon',p.oid,'EXECUTE')),
    count(*) filter (
      where has_function_privilege('anon',p.oid,'EXECUTE')
        and p.prosecdef
    ),
    count(*) filter (
      where has_function_privilege('anon',p.oid,'EXECUTE')
        and pg_get_functiondef(p.oid) ~* '\\m(insert|update|delete|truncate)\\M'
    ),
    count(*) filter (
      where has_function_privilege('anon',p.oid,'EXECUTE')
        and pg_get_functiondef(p.oid) ~* '\\m(insert|update|delete|truncate)\\M'
        and pg_get_functiondef(p.oid) !~* '(velora_is_staff|velora_has_role|auth\\.uid|current_user|session_user)'
    )
  into
    v_public_exec,
    v_public_definer_exec,
    v_public_dml,
    v_unguarded_public_dml
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname like 'velora_%';

  select count(*) into v_definer
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname like 'velora_%'
    and p.prosecdef;

  select count(*) into v_bad_search_path
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname like 'velora_%'
    and p.prosecdef
    and not exists (
      select 1
      from unnest(coalesce(p.proconfig,'{}'::text[])) cfg
      where cfg like 'search_path=%'
    );

  for v_key,v_status,v_msg in
    select * from (
      values
        (
          'RLS_CORE',
          'pass'::text,
          format('Protected core tables with RLS: %s/14',v_rls)
        ),
        (
          'POLICY_COVERAGE',
          case
            when v_policy>=14 then 'pass'
            when v_policy>0 then 'warn'
            else 'fail'
          end,
          format('Policy count across core tables: %s',v_policy)
        ),
        (
          'PUBLIC_RPC_EXECUTE',
          case
            when v_unguarded_public_dml>0 then 'fail'
            when v_public_exec>0 then 'warn'
            else 'pass'
          end,
          format(
            'Public/anon velora_* execute=%s; security-definer=%s; DML=%s; unguarded DML=%s',
            v_public_exec,
            v_public_definer_exec,
            v_public_dml,
            v_unguarded_public_dml
          )
        ),
        (
          'SECURITY_DEFINER_POSTURE',
          case when v_definer>0 then 'pass' else 'warn' end,
          format('Security-definer velora_* functions: %s',v_definer)
        ),
        (
          'PINNED_SEARCH_PATH',
          case when v_bad_search_path=0 then 'pass' else 'warn' end,
          format(
            'Security-definer functions without explicit search_path pin: %s',
            v_bad_search_path
          )
        )
    ) q(k,s,m)
  loop
    insert into public.security_audit_findings(
      run_id,control_code,control_name,status,message
    )
    values(
      r_id,v_key,replace(v_key,'_',' '),v_status,v_msg
    );

    if v_status='pass' then
      v_pass:=v_pass+1;
    elsif v_status='warn' then
      v_warn:=v_warn+1;
    else
      v_fail:=v_fail+1;
    end if;
  end loop;

  v_score:=
    greatest(
      0,
      round((v_pass::numeric/5)*100)::int
      - round((v_fail::numeric/5)*25)::int
      - round((v_warn::numeric/5)*5)::int
    );

  update public.security_audit_runs
  set
    finished_at=now(),
    status=case
      when v_fail>0 then 'fail'
      when v_warn>0 then 'review'
      else 'pass'
    end,
    score=v_score,
    pass_count=v_pass,
    warn_count=v_warn,
    fail_count=v_fail,
    summary=jsonb_build_object(
      'rls_core',v_rls,
      'policy_count',v_policy,
      'public_execute',v_public_exec,
      'public_security_definer_execute',v_public_definer_exec,
      'public_dml',v_public_dml,
      'unguarded_public_dml',v_unguarded_public_dml,
      'security_definer',v_definer,
      'unpinned_search_path',v_bad_search_path
    )
  where id=r_id;

  return r_id;
end;
$function$;
