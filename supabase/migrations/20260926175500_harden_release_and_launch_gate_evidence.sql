-- Velora Restore-Test governance hardening
-- Release state-machine enforcement + evidence-backed launch gate audit.
-- No schema changes; production untouched.

CREATE OR REPLACE FUNCTION public.velora_add_release_check(
  p_release_id uuid,
  p_check_code text,
  p_check_name text,
  p_status text,
  p_evidence jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_release public.release_records%rowtype;
  v_id uuid;
  v_status text := lower(trim(coalesce(p_status,'')));
  v_code text := trim(coalesce(p_check_code,''));
  v_name text := trim(coalesce(p_check_name,''));
  v_evidence jsonb := coalesce(p_evidence,'{}'::jsonb);
BEGIN
  IF auth.uid() IS NULL OR NOT public.velora_is_staff() THEN
    RAISE EXCEPTION 'STAFF_ONLY';
  END IF;

  IF p_release_id IS NULL OR v_code = '' OR v_name = '' THEN
    RAISE EXCEPTION 'RELEASE_CHECK_IDENTIFIERS_REQUIRED';
  END IF;

  IF v_status NOT IN ('pass','warn','fail','blocked','pending') THEN
    RAISE EXCEPTION 'INVALID_RELEASE_CHECK_STATUS';
  END IF;

  IF jsonb_typeof(v_evidence) <> 'object' THEN
    RAISE EXCEPTION 'RELEASE_CHECK_EVIDENCE_OBJECT_REQUIRED';
  END IF;

  IF v_status <> 'pending' AND v_evidence = '{}'::jsonb THEN
    RAISE EXCEPTION 'RELEASE_CHECK_EVIDENCE_REQUIRED';
  END IF;

  SELECT *
    INTO v_release
  FROM public.release_records
  WHERE id = p_release_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RELEASE_NOT_FOUND';
  END IF;

  IF v_release.status <> 'candidate' THEN
    RAISE EXCEPTION 'RELEASE_CHECKS_LOCKED_AFTER_CANDIDATE';
  END IF;

  INSERT INTO public.release_checks(
    release_id,check_code,check_name,status,evidence,checked_at
  )
  VALUES(
    p_release_id,v_code,v_name,v_status,v_evidence,now()
  )
  ON CONFLICT (release_id,check_code)
  DO UPDATE SET
    check_name=excluded.check_name,
    status=excluded.status,
    evidence=excluded.evidence,
    checked_at=now()
  RETURNING id INTO v_id;

  INSERT INTO public.audit_logs(
    actor_id,action,entity_type,entity_id,metadata
  )
  VALUES(
    auth.uid(),
    'release_check_recorded',
    'release',
    p_release_id,
    jsonb_build_object(
      'check_id',v_id,
      'check_code',v_code,
      'status',v_status,
      'has_evidence',v_evidence <> '{}'::jsonb
    )
  );

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.velora_update_release_status(
  p_release_id uuid,
  p_status text,
  p_checkpoint text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_release public.release_records%rowtype;
  v_target text := lower(trim(coalesce(p_status,'')));
  v_checkpoint text := nullif(trim(coalesce(p_checkpoint,'')),'');
  v_check_count integer := 0;
  v_bad_check_count integer := 0;
  v_pending_check_count integer := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.velora_is_staff() THEN
    RAISE EXCEPTION 'STAFF_ONLY';
  END IF;

  IF p_release_id IS NULL THEN
    RAISE EXCEPTION 'RELEASE_ID_REQUIRED';
  END IF;

  IF v_target NOT IN ('draft','candidate','approved','deployed','rolled_back','blocked') THEN
    RAISE EXCEPTION 'INVALID_RELEASE_STATUS';
  END IF;

  SELECT *
    INTO v_release
  FROM public.release_records
  WHERE id = p_release_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RELEASE_NOT_FOUND';
  END IF;

  IF NOT (
    (v_release.status='draft' AND v_target='candidate')
    OR (v_release.status='candidate' AND v_target IN ('approved','blocked'))
    OR (v_release.status='approved' AND v_target IN ('deployed','blocked'))
    OR (v_release.status='deployed' AND v_target='rolled_back')
  ) THEN
    RAISE EXCEPTION 'INVALID_RELEASE_TRANSITION';
  END IF;

  SELECT
    count(*)::int,
    count(*) FILTER (WHERE status IN ('fail','blocked'))::int,
    count(*) FILTER (WHERE status='pending')::int
  INTO v_check_count,v_bad_check_count,v_pending_check_count
  FROM public.release_checks
  WHERE release_id=p_release_id;

  IF v_target='approved' THEN
    IF v_check_count=0 THEN
      RAISE EXCEPTION 'RELEASE_CHECKS_REQUIRED_BEFORE_APPROVAL';
    END IF;
    IF v_bad_check_count>0 THEN
      RAISE EXCEPTION 'RELEASE_HAS_FAILED_OR_BLOCKED_CHECKS';
    END IF;
    IF v_pending_check_count>0 THEN
      RAISE EXCEPTION 'RELEASE_HAS_PENDING_CHECKS';
    END IF;
  END IF;

  IF v_target='deployed' THEN
    IF v_release.status <> 'approved' THEN
      RAISE EXCEPTION 'RELEASE_APPROVAL_REQUIRED';
    END IF;
    IF v_check_count=0 OR v_bad_check_count>0 OR v_pending_check_count>0 THEN
      RAISE EXCEPTION 'RELEASE_CHECKS_NOT_CLEAR_FOR_DEPLOYMENT';
    END IF;
    IF v_checkpoint IS NULL THEN
      RAISE EXCEPTION 'DEPLOYMENT_CHECKPOINT_REQUIRED';
    END IF;
  END IF;

  IF v_target='rolled_back' AND v_checkpoint IS NULL THEN
    RAISE EXCEPTION 'ROLLBACK_CHECKPOINT_REQUIRED';
  END IF;

  UPDATE public.release_records
  SET
    status=v_target,
    rollback_checkpoint=coalesce(v_checkpoint,rollback_checkpoint),
    deployed_at=CASE
      WHEN v_target='deployed' THEN coalesce(deployed_at,now())
      ELSE deployed_at
    END,
    updated_at=now()
  WHERE id=p_release_id;

  INSERT INTO public.audit_logs(
    actor_id,action,entity_type,entity_id,metadata
  )
  VALUES(
    auth.uid(),
    'release_status_changed',
    'release',
    p_release_id,
    jsonb_build_object(
      'from_status',v_release.status,
      'to_status',v_target,
      'checkpoint',v_checkpoint,
      'check_count',v_check_count,
      'bad_check_count',v_bad_check_count,
      'pending_check_count',v_pending_check_count
    )
  );

  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.velora_run_launch_gate_audit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  d jsonb;
  v_core_tables integer;
  v_core_functions integer;
  v_rls_tables integer;
  v_analytics_functions integer;
  v_integrity_parts integer;
  v_workflow_functions integer;
  v_workflow_tables integer;
  v_trust_tables integer;
  v_trust_functions integer;
  v_e2e_status text;
  v_e2e_pass integer := 0;
  v_e2e_fail integer := 0;
  v_e2e_blocked integer := 0;
  v_e2e_total integer := 0;
  v_e2e_checked boolean := false;
  v_has_payment_config boolean := false;
  v_has_webhook_config boolean := false;
BEGIN
  IF auth.uid() IS NULL OR NOT public.velora_is_staff() THEN
    RAISE EXCEPTION 'STAFF_ONLY';
  END IF;

  -- Commerce: structural contract evidence only.
  SELECT count(*)::int
    INTO v_core_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND c.relkind='r'
    AND c.relname IN ('products','product_variants','orders','order_items','carts');

  SELECT count(*)::int
    INTO v_core_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN ('velora_create_order_with_commercials','velora_get_marketplace_catalog');

  -- Security/RLS: exact core set used by launch-readiness checks.
  SELECT count(*)::int
    INTO v_rls_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND c.relkind='r'
    AND c.relrowsecurity
    AND c.relname IN (
      'users','profiles','user_roles','sellers','stores','products',
      'orders','order_items','shipments','returns','disputes','fraud_events',
      'audit_logs','seller_applications','payment_attempts'
    );

  SELECT count(*)::int
    INTO v_analytics_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN ('velora_get_admin_analytics','velora_get_seller_analytics');

  SELECT count(*)::int
    INTO v_integrity_parts
  FROM (
    SELECT 1
    WHERE to_regclass('public.reconciliation_runs') IS NOT NULL
    UNION ALL
    SELECT 1
    WHERE to_regclass('public.reconciliation_findings') IS NOT NULL
    UNION ALL
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='velora_run_integrity_scan'
  ) x;

  SELECT count(*)::int
    INTO v_workflow_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN (
      'velora_create_workflow_case',
      'velora_update_workflow_case',
      'velora_escalate_workflow_case'
    );

  SELECT count(*)::int
    INTO v_workflow_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND c.relkind='r'
    AND c.relname IN ('workflow_cases','workflow_events','workflow_escalations');

  SELECT count(*)::int
    INTO v_trust_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND c.relkind='r'
    AND c.relname IN ('returns','return_items','disputes','fraud_events');

  SELECT count(*)::int
    INTO v_trust_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN (
      'velora_request_return',
      'velora_resolve_return',
      'velora_open_dispute',
      'velora_resolve_dispute',
      'velora_account_action'
    );

  -- E2E gate: runtime evidence is required; no run means no pass.
  SELECT status,pass_count,fail_count,blocked_count,total_count
    INTO v_e2e_status,v_e2e_pass,v_e2e_fail,v_e2e_blocked,v_e2e_total
  FROM public.e2e_test_runs
  ORDER BY started_at DESC
  LIMIT 1;

  IF v_e2e_status IS NOT NULL THEN
    v_e2e_checked := true;
  END IF;

  -- External integrations are intentionally evidence-blocked here.
  SELECT EXISTS(
    SELECT 1 FROM public.integration_configs
    WHERE integration_key='payment_gateway'
  ) INTO v_has_payment_config;

  SELECT EXISTS(
    SELECT 1 FROM public.integration_configs
    WHERE integration_key='payment_webhook'
  ) INTO v_has_webhook_config;

  UPDATE public.velora_launch_gates
  SET
    status = CASE WHEN v_core_tables=5 AND v_core_functions=2 THEN 'pass' ELSE 'fail' END,
    evidence = jsonb_build_object(
      'evidence_type','db_inventory',
      'verified_at',now(),
      'core_tables',v_core_tables,
      'expected_core_tables',5,
      'core_functions',v_core_functions,
      'expected_core_functions',2,
      'runtime_test',false
    ),
    checked_at=now(),
    notes='Structural commerce contract verified from live Restore-Test database; this is not Browser/E2E evidence.'
  WHERE gate_code='commerce_core';

  UPDATE public.velora_launch_gates
  SET
    status = CASE WHEN v_rls_tables=15 THEN 'pass' ELSE 'fail' END,
    evidence = jsonb_build_object(
      'evidence_type','rls_inventory',
      'verified_at',now(),
      'rls_core_tables',v_rls_tables,
      'expected_rls_core_tables',15
    ),
    checked_at=now(),
    notes='Core launch-readiness RLS inventory verified from database metadata.'
  WHERE gate_code='security_rls';

  UPDATE public.velora_launch_gates
  SET
    status = CASE WHEN v_e2e_checked AND v_e2e_status='passed'
                       AND v_e2e_fail=0
                       AND v_e2e_blocked=0
                       AND v_e2e_total=v_e2e_pass
                  THEN 'pass'
                  WHEN v_e2e_checked AND v_e2e_status='failed' THEN 'fail'
                  WHEN v_e2e_checked AND v_e2e_status='blocked' THEN 'blocked'
                  ELSE 'pending'
             END,
    evidence = jsonb_build_object(
      'evidence_type','e2e_runtime_run',
      'verified_at',now(),
      'has_runtime_run',v_e2e_checked,
      'latest_status',v_e2e_status,
      'pass_count',v_e2e_pass,
      'fail_count',v_e2e_fail,
      'blocked_count',v_e2e_blocked,
      'total_count',v_e2e_total
    ),
    checked_at=now(),
    notes='PASS requires an actual recorded E2E run; structural presence alone cannot satisfy this gate.'
  WHERE gate_code='e2e_tests';

  UPDATE public.velora_launch_gates
  SET
    status = CASE WHEN v_integrity_parts=3 THEN 'pass' ELSE 'fail' END,
    evidence = jsonb_build_object(
      'evidence_type','db_inventory',
      'verified_at',now(),
      'integrity_components',v_integrity_parts,
      'expected_components',3
    ),
    checked_at=now(),
    notes='Integrity engine structure is present; this gate does not claim a clean reconciliation result without a recorded run.'
  WHERE gate_code='integrity_engine';

  UPDATE public.velora_launch_gates
  SET
    status = CASE WHEN v_workflow_functions=3 AND v_workflow_tables=3 THEN 'pass' ELSE 'fail' END,
    evidence = jsonb_build_object(
      'evidence_type','db_inventory',
      'verified_at',now(),
      'workflow_functions',v_workflow_functions,
      'expected_workflow_functions',3,
      'workflow_tables',v_workflow_tables,
      'expected_workflow_tables',3
    ),
    checked_at=now(),
    notes='Workflow control-plane structure verified; this does not claim a production operational drill.'
  WHERE gate_code='operations_workflows';

  UPDATE public.velora_launch_gates
  SET
    status = CASE WHEN v_trust_tables=4 AND v_trust_functions=5 THEN 'pass' ELSE 'fail' END,
    evidence = jsonb_build_object(
      'evidence_type','db_inventory',
      'verified_at',now(),
      'trust_tables',v_trust_tables,
      'expected_trust_tables',4,
      'trust_functions',v_trust_functions,
      'expected_trust_functions',5
    ),
    checked_at=now(),
    notes='Trust/Safety control-plane structure verified; runtime moderation/returns drills remain separate evidence.'
  WHERE gate_code='trust_safety';

  UPDATE public.velora_launch_gates
  SET
    status = CASE WHEN v_analytics_functions=2 THEN 'pass' ELSE 'fail' END,
    evidence = jsonb_build_object(
      'evidence_type','db_inventory',
      'verified_at',now(),
      'analytics_functions',v_analytics_functions,
      'expected_analytics_functions',2
    ),
    checked_at=now(),
    notes='Analytics control-plane functions are present in Restore-Test; infrastructure telemetry is not inferred.'
  WHERE gate_code='analytics';

  UPDATE public.velora_launch_gates
  SET
    status='blocked',
    evidence=jsonb_build_object(
      'evidence_type','external_dependency',
      'verified_at',now(),
      'config_record_present',v_has_payment_config,
      'credentials_verified',false,
      'live_settlement_verified',false,
      'provider_call_performed',false
    ),
    checked_at=now(),
    notes='Blocked until real provider credentials, live provider validation and production cutover evidence exist.'
  WHERE gate_code='payment_provider';

  UPDATE public.velora_launch_gates
  SET
    status='blocked',
    evidence=jsonb_build_object(
      'evidence_type','external_dependency',
      'verified_at',now(),
      'config_record_present',v_has_webhook_config,
      'signature_verified',false,
      'signed_callback_test_performed',false
    ),
    checked_at=now(),
    notes='Blocked until provider-specific cryptographic webhook verification is implemented and tested.'
  WHERE gate_code='webhook_verification';

  UPDATE public.velora_launch_gates
  SET
    status='blocked',
    evidence=jsonb_build_object(
      'evidence_type','external_dependency',
      'verified_at',now(),
      'required_for_launch',false,
      'real_carrier_verified',false,
      'manual_fulfillment_available',true
    ),
    checked_at=now(),
    notes='Carrier integration remains external; manual fulfillment is available and this gate is not launch-required.'
  WHERE gate_code='shipping_provider';

  UPDATE public.velora_launch_gates
  SET
    status='pending',
    evidence=jsonb_build_object(
      'evidence_type','external_environment',
      'verified_at',now(),
      'database_validation_only',true,
      'environment_reviewed',false
    ),
    checked_at=now(),
    notes='Requires environment-level deployment/hosting review outside the database.'
  WHERE gate_code='production_infra';

  UPDATE public.velora_launch_gates
  SET
    status='pending',
    evidence=jsonb_build_object(
      'evidence_type','external_environment',
      'verified_at',now(),
      'database_validation_only',true,
      'backup_drill_verified',false,
      'rollback_drill_verified',false
    ),
    checked_at=now(),
    notes='Requires real backup/rollback validation in the deployment environment.'
  WHERE gate_code='rollback_backup';

  SELECT public.velora_get_launch_control_plane() INTO d;
  RETURN d;
END;
$function$;
