# Velora Source Hardening Audit — 2026-09-25

Scope: Restore-Test project only (arlaxqmhtvjwjbjinjfw).
Production remains frozen.

## Completed in this audit

- velora_marketplace_catalog view grants reduced to SELECT-only for anon and authenticated.
- Internal snapshot/reconciliation tables had anonymous direct SELECT removed.
- Direct authenticated writes to internal reconciliation/observability/finops/growth snapshot tables removed; RLS-backed authenticated SELECT remains where policies allow.
- velora_test_delete_fixture(uuid) remains service_role-only and no longer correlates cleanup through unsigned payment_key_claims.extra.velora_order_id; cleanup correlates through the bound payment attempt Paymob order metadata.
- Public SECURITY DEFINER scan found only the five intentional public read APIs: velora_get_commission_rate, velora_get_fx_rate, velora_get_i18n_catalog, velora_get_localized_content, velora_get_marketplace_catalog.
- Authenticated SECURITY DEFINER functions were reviewed for obvious actor guards. The no-guard-marker exceptions were limited to the intentional public-read APIs and payment-attempt wrappers that delegate to the guarded core function.
- Sensitive RLS-enabled/no-policy tables currently have no direct anon or authenticated table privileges.

## Current Supabase Security Advisor state

Remaining notices are mostly intentional architecture/configuration items:
- 6 INFO rls_enabled_no_policy notices. Direct anon/authenticated privileges are already absent on the affected tables.
- 1 WARN extension_in_public for pg_net. Do not move the extension without a dependency migration plan because notification dispatch uses pg_net.
- 5 WARN anon_security_definer_function_executable notices for intentional public read RPCs.
- 160 WARN authenticated_security_definer_function_executable notices. These reflect the project's deliberate SECURITY DEFINER RPC architecture; source-level actor checks/ownership checks are required per function rather than blanket revocation.
- 1 WARN auth_leaked_password_protection remains a Supabase Auth project-setting item and was not changed by SQL.

## Boundary

No Production database or Production Edge Function was changed during this audit.