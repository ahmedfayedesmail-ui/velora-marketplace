-- Correct launch-readiness references to the canonical fraud risk table.
-- No schema changes; Restore-Test only.

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

  SELECT count(*)::int INTO v_core_tables
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r'
    AND c.relname IN ('products','product_variants','orders','order_items','carts');

  SELECT count(DISTINCT p.proname)::int INTO v_core_functions
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN ('velora_create_order_with_commercials','velora_get_marketplace_catalog');

  SELECT count(*)::int INTO v_rls_tables
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity
    AND c.relname IN (
      'users','profiles','user_roles','sellers','stores','products',
      'orders','order_items','shipments','returns','disputes','fraud_risk_events',
      'audit_logs','seller_applications','payment_attempts'
    );

  SELECT count(DISTINCT p.proname)::int INTO v_analytics_functions
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN ('velora_get_admin_analytics','velora_get_seller_analytics');

  SELECT count(*)::int INTO v_integrity_parts
  FROM (
    SELECT 1 WHERE to_regclass('public.reconciliation_runs') IS NOT NULL
    UNION ALL SELECT 1 WHERE to_regclass('public.reconciliation_findings') IS NOT NULL
    UNION ALL SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='public' AND p.proname='velora_run_integrity_scan'
  ) x;

  SELECT count(DISTINCT p.proname)::int INTO v_workflow_functions
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN (
      'velora_create_workflow_case',
      'velora_update_workflow_case',
      'velora_escalate_workflow_case'
    );

  SELECT count(*)::int INTO v_workflow_tables
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r'
    AND c.relname IN ('workflow_cases','workflow_events','workflow_escalations');

  SELECT count(*)::int INTO v_trust_tables
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r'
    AND c.relname IN ('returns','return_items','disputes','fraud_risk_events');

  SELECT count(DISTINCT p.proname)::int INTO v_trust_functions
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN (
      'velora_request_return',
      'velora_resolve_return',
      'velora_open_dispute',
      'velora_resolve_dispute',
      'velora_account_action'
    );

  SELECT status,pass_count,fail_count,blocked_count,total_count
    INTO v_e2e_status,v_e2e_pass,v_e2e_fail,v_e2e_blocked,v_e2e_total
  FROM public.e2e_test_runs
  ORDER BY started_at DESC
  LIMIT 1;
  v_e2e_checked := v_e2e_status IS NOT NULL;

  SELECT EXISTS(
    SELECT 1 FROM public.integration_configs WHERE integration_key='payment_gateway'
  ) INTO v_has_payment_config;

  SELECT EXISTS(
    SELECT 1 FROM public.integration_configs WHERE integration_key='payment_webhook'
  ) INTO v_has_webhook_config;

  UPDATE public.velora_launch_gates
  SET status=CASE WHEN v_core_tables=5 AND v_core_functions=2 THEN 'pass' ELSE 'fail' END,
      evidence=jsonb_build_object(
        'evidence_type','db_inventory','verified_at',now(),
        'core_tables',v_core_tables,'expected_core_tables',5,
        'core_functions',v_core_functions,'expected_core_functions',2,
        'runtime_test',false
      ),
      checked_at=now(),
      notes='Structural commerce contract verified from live Restore-Test database; this is not Browser/E2E evidence.'
  WHERE gate_code='commerce_core';

  UPDATE public.velora_launch_gates
  SET status=CASE WHEN v_rls_tables=15 THEN 'pass' ELSE 'fail' END,
      evidence=jsonb_build_object(
        'evidence_type','rls_inventory','verified_at',now(),
        'rls_core_tables',v_rls_tables,'expected_rls_core_tables',15,
        'fraud_risk_table','fraud_risk_events'
      ),
      checked_at=now(),
      notes='Core launch-readiness RLS inventory verified from database metadata using the canonical fraud_risk_events table.'
  WHERE gate_code='security_rls';

  UPDATE public.velora_launch_gates
  SET status=CASE
      WHEN v_e2e_checked AND v_e2e_status='passed'
       AND v_e2e_fail=0 AND v_e2e_blocked=0 AND v_e2e_total=v_e2e_pass THEN 'pass'
      WHEN v_e2e_checked AND v_e2e_status='failed' THEN 'fail'
      WHEN v_e2e_checked AND v_e2e_status='blocked' THEN 'blocked'
      ELSE 'pending' END,
      evidence=jsonb_build_object(
        'evidence_type','e2e_runtime_run','verified_at',now(),
        'has_runtime_run',v_e2e_checked,'latest_status',v_e2e_status,
        'pass_count',v_e2e_pass,'fail_count',v_e2e_fail,
        'blocked_count',v_e2e_blocked,'total_count',v_e2e_total
      ),
      checked_at=now(),
      notes='PASS requires an actual recorded E2E run; structural presence alone cannot satisfy this gate.'
  WHERE gate_code='e2e_tests';

  UPDATE public.velora_launch_gates
  SET status=CASE WHEN v_integrity_parts=3 THEN 'pass' ELSE 'fail' END,
      evidence=jsonb_build_object(
        'evidence_type','db_inventory','verified_at',now(),
        'integrity_components',v_integrity_parts,'expected_components',3
      ),
      checked_at=now(),
      notes='Integrity engine structure is present; this gate does not claim a clean reconciliation result without a recorded run.'
  WHERE gate_code='integrity_engine';

  UPDATE public.velora_launch_gates
  SET status=CASE WHEN v_workflow_functions=3 AND v_workflow_tables=3 THEN 'pass' ELSE 'fail' END,
      evidence=jsonb_build_object(
        'evidence_type','db_inventory','verified_at',now(),
        'workflow_functions',v_workflow_functions,'expected_workflow_functions',3,
        'workflow_tables',v_workflow_tables,'expected_workflow_tables',3
      ),
      checked_at=now(),
      notes='Workflow control-plane structure verified; this does not claim a production operational drill.'
  WHERE gate_code='operations_workflows';

  UPDATE public.velora_launch_gates
  SET status=CASE WHEN v_trust_tables=4 AND v_trust_functions=5 THEN 'pass' ELSE 'fail' END,
      evidence=jsonb_build_object(
        'evidence_type','db_inventory','verified_at',now(),
        'trust_tables',v_trust_tables,'expected_trust_tables',4,
        'trust_functions',v_trust_functions,'expected_trust_functions',5,
        'fraud_risk_table','fraud_risk_events'
      ),
      checked_at=now(),
      notes='Trust/Safety control-plane structure verified against the canonical fraud_risk_events table; runtime drills remain separate evidence.'
  WHERE gate_code='trust_safety';

  UPDATE public.velora_launch_gates
  SET status=CASE WHEN v_analytics_functions=2 THEN 'pass' ELSE 'fail' END,
      evidence=jsonb_build_object(
        'evidence_type','db_inventory','verified_at',now(),
        'analytics_functions',v_analytics_functions,'expected_analytics_functions',2
      ),
      checked_at=now(),
      notes='Analytics control-plane functions are present in Restore-Test; infrastructure telemetry is not inferred.'
  WHERE gate_code='analytics';

  UPDATE public.velora_launch_gates
  SET status='blocked',
      evidence=jsonb_build_object(
        'evidence_type','external_dependency','verified_at',now(),
        'config_record_present',v_has_payment_config,
        'credentials_verified',false,'live_settlement_verified',false,
        'provider_call_performed',false
      ),
      checked_at=now(),
      notes='Blocked until real provider credentials, live provider validation and production cutover evidence exist.'
  WHERE gate_code='payment_provider';

  UPDATE public.velora_launch_gates
  SET status='blocked',
      evidence=jsonb_build_object(
        'evidence_type','external_dependency','verified_at',now(),
        'config_record_present',v_has_webhook_config,
        'signature_verified',false,'signed_callback_test_performed',false
      ),
      checked_at=now(),
      notes='Blocked until provider-specific cryptographic webhook verification is implemented and tested.'
  WHERE gate_code='webhook_verification';

  UPDATE public.velora_launch_gates
  SET status='blocked',
      evidence=jsonb_build_object(
        'evidence_type','external_dependency','verified_at',now(),
        'required_for_launch',false,'real_carrier_verified',false,
        'manual_fulfillment_available',true
      ),
      checked_at=now(),
      notes='Carrier integration remains external; manual fulfillment is available and this gate is not launch-required.'
  WHERE gate_code='shipping_provider';

  UPDATE public.velora_launch_gates
  SET status='pending',
      evidence=jsonb_build_object(
        'evidence_type','external_environment','verified_at',now(),
        'database_validation_only',true,'environment_reviewed',false
      ),
      checked_at=now(),
      notes='Requires environment-level deployment/hosting review outside the database.'
  WHERE gate_code='production_infra';

  UPDATE public.velora_launch_gates
  SET status='pending',
      evidence=jsonb_build_object(
        'evidence_type','external_environment','verified_at',now(),
        'database_validation_only',true,'backup_drill_verified',false,
        'rollback_drill_verified',false
      ),
      checked_at=now(),
      notes='Requires real backup/rollback validation in the deployment environment.'
  WHERE gate_code='rollback_backup';

  SELECT public.velora_get_launch_control_plane() INTO d;
  RETURN d;
END;
$function$;

CREATE OR REPLACE FUNCTION public.velora_get_launch_readiness()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  staff boolean;
  rls_count integer;
  required_functions integer;
  required_tables integer;
  active_providers integer;
  webhook_enabled_providers integer;
  production_providers integer;
  result jsonb;
BEGIN
  staff := public.velora_is_staff();
  IF NOT staff THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT count(*) INTO rls_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname='public'
    AND c.relkind='r'
    AND c.relrowsecurity
    AND c.relname IN (
      'users','profiles','user_roles','sellers','stores','products',
      'orders','order_items','shipments','returns','disputes','fraud_risk_events',
      'audit_logs','seller_applications','payment_attempts'
    );

  SELECT count(DISTINCT p.proname) INTO required_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.proname IN (
      'velora_get_security_diagnostics','velora_get_performance_summary',
      'velora_get_admin_analytics','velora_get_seller_analytics',
      'velora_create_order','velora_create_payment_attempt',
      'velora_create_shipment','velora_submit_delivery_proof'
    );

  SELECT count(*) INTO required_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public'
    AND c.relkind IN ('r','v','m')
    AND c.relname IN (
      'orders','order_items','payment_attempts','shipments','returns',
      'disputes','fraud_risk_events','audit_logs','payment_providers'
    );

  SELECT count(*) INTO active_providers FROM public.payment_providers WHERE is_active=true;
  SELECT count(*) INTO webhook_enabled_providers FROM public.payment_providers WHERE is_active=true AND webhook_enabled=true;
  SELECT count(*) INTO production_providers FROM public.payment_providers WHERE is_active=true AND lower(coalesce(environment,'')) IN ('production','live');

  result := jsonb_build_object(
    'authorized',true,
    'rls_core_tables',rls_count,
    'required_function_count',required_functions,
    'required_table_count',required_tables,
    'active_payment_providers',active_providers,
    'webhook_enabled_payment_providers',webhook_enabled_providers,
    'production_payment_providers',production_providers,
    'payment_provider_credentials_verified',false,
    'webhook_signature_verification_verified',false,
    'fraud_risk_table','fraud_risk_events',
    'launch_gate_notes',jsonb_build_array(
      'Live payment settlement requires real provider credentials and provider-specific verification.',
      'Provider webhook signature verification must be implemented and tested before production go-live.',
      'Shipping carrier integration remains provider-specific; manual tracking is supported by the canonical model.'
    )
  );
  RETURN result;
END;
$function$;