-- Governed ingestion for real Browser Gate evidence into the canonical E2E gate tables.
-- Service-role only. No anon/authenticated execution.

create or replace function public.velora_record_browser_e2e_evidence(
  p_workflow_run_id bigint,
  p_commit_sha text,
  p_preview_url text,
  p_status text,
  p_evidence jsonb,
  p_workflow_job_id bigint default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_run_id uuid;
  v_status text := lower(trim(coalesce(p_status,'')));
  v_checks jsonb := coalesce(p_evidence->'checks','{}'::jsonb);
  v_passed boolean := coalesce((p_evidence->>'passed')::boolean,false);
  v_details jsonb;
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  if p_workflow_run_id is null then
    raise exception 'workflow_run_id_required';
  end if;

  if nullif(trim(coalesce(p_commit_sha,'')),'') is null then
    raise exception 'commit_sha_required';
  end if;

  if nullif(trim(coalesce(p_preview_url,'')),'') is null
     or trim(p_preview_url) !~* '^https://'
  then
    raise exception 'preview_url_required';
  end if;

  if v_status not in ('passed','failed','blocked') then
    raise exception 'INVALID_E2E_STATUS';
  end if;

  if jsonb_typeof(p_evidence) <> 'object'
     or p_evidence->>'browser_evidence_schema' <> 'v1'
     or jsonb_typeof(v_checks) <> 'object'
  then
    raise exception 'INVALID_BROWSER_EVIDENCE_SCHEMA';
  end if;

  if v_status = 'passed' then
    if not v_passed
       or jsonb_array_length(coalesce(p_evidence->'failures','[]'::jsonb)) <> 0
       or jsonb_array_length(coalesce(p_evidence->'page_errors','[]'::jsonb)) <> 0
       or (v_checks->>'http_status') <> '200'
       or (v_checks->>'authenticated_session') <> 'true'
       or (v_checks->>'state_user_present') <> 'true'
       or (v_checks->>'canonical_cart_sync_ok') <> 'true'
       or (v_checks->>'local_cart_has_test_product') <> 'true'
       or coalesce((v_checks->>'local_cart_test_quantity')::int,0) < 1
       or (v_checks->>'checkout_has_product') <> 'true'
       or (v_checks->>'checkout_has_empty_state') = 'true'
       or (v_checks->>'session_survived_checkout_navigation') <> 'true'
       or (v_checks->>'checkout_has_shipping_ar_after_login') <> 'true'
       or (v_checks->>'checkout_has_payment_ar_after_login') <> 'true'
       or (v_checks->>'checkout_has_summary_ar_after_login') <> 'true'
       or (v_checks->>'checkout_has_place_order_ar_after_login') <> 'true'
    then
      raise exception 'BROWSER_EVIDENCE_PASS_CONTRACT_FAILED';
    end if;
  end if;

  select id into v_run_id
  from public.e2e_test_runs
  where summary->>'workflow_run_id' = p_workflow_run_id::text
  limit 1
  for update;

  v_details := coalesce(p_evidence,'{}'::jsonb)
    || jsonb_build_object(
      'evidence_type','browser',
      'workflow_run_id',p_workflow_run_id,
      'workflow_job_id',p_workflow_job_id,
      'commit_sha',trim(p_commit_sha),
      'preview_url',trim(p_preview_url)
    );

  if v_run_id is null then
    insert into public.e2e_test_runs(
      status,pass_count,fail_count,blocked_count,total_count,summary
    )
    values(
      v_status,
      case when v_status='passed' then 1 else 0 end,
      case when v_status='failed' then 1 else 0 end,
      case when v_status='blocked' then 1 else 0 end,
      1,
      jsonb_build_object(
        'evidence_type','browser',
        'browser_evidence_schema','v1',
        'workflow_run_id',p_workflow_run_id,
        'workflow_job_id',p_workflow_job_id,
        'commit_sha',trim(p_commit_sha),
        'preview_url',trim(p_preview_url),
        'recorded_via','velora_record_browser_e2e_evidence'
      )
    )
    returning id into v_run_id;
  else
    update public.e2e_test_runs
    set finished_at=now(),
        status=v_status,
        pass_count=case when v_status='passed' then 1 else 0 end,
        fail_count=case when v_status='failed' then 1 else 0 end,
        blocked_count=case when v_status='blocked' then 1 else 0 end,
        total_count=1,
        summary=jsonb_build_object(
          'evidence_type','browser',
          'browser_evidence_schema','v1',
          'workflow_run_id',p_workflow_run_id,
          'workflow_job_id',p_workflow_job_id,
          'commit_sha',trim(p_commit_sha),
          'preview_url',trim(p_preview_url),
          'recorded_via','velora_record_browser_e2e_evidence'
        )
    where id=v_run_id;
    delete from public.e2e_test_results where run_id=v_run_id;
  end if;

  insert into public.e2e_test_results(
    run_id,test_code,test_name,scope,result,message,details
  )
  values(
    v_run_id,
    'BROWSER_AUTH_CART_CHECKOUT',
    'Authenticated browser: login → cart → checkout → Arabic',
    'browser',
    v_status,
    case
      when v_status='passed' then 'Browser evidence contract accepted.'
      when v_status='blocked' then 'Browser evidence was blocked.'
      else 'Browser evidence recorded as failed.'
    end,
    v_details
  );

  return v_run_id;
end;
$function$;

revoke all on function public.velora_record_browser_e2e_evidence(bigint,text,text,text,jsonb,bigint)
  from public, anon, authenticated;

grant execute on function public.velora_record_browser_e2e_evidence(bigint,text,text,text,jsonb,bigint)
  to service_role;
