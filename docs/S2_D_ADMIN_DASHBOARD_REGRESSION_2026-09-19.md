# S2-D Admin Dashboard Regression Evidence
Date: 2026-09-19
Environment: Restore-Test only
Production: FROZEN

## Database
PASS
- Staff role can execute velora_get_admin_dashboard().
- Non-staff authenticated caller is rejected with ADMIN_ACCESS_REQUIRED.
- RPC is SECURITY DEFINER with search_path=''.
- anon execute is denied.
- authenticated execute is granted.
- The RPC is read-only; no writes are performed.
- Order value is returned per currency rather than combined across currencies.

## Static integration
PASS
- 56-s2d-admin.js is loaded after S2-E.
- Existing admin navigation and management sections are preserved.
- Dashboard is refreshed from authoritative RPC data.
- Dashboard rendering contains no destructive mutation controls.
- Manifest entry order 56 matches the script length.

## Browser E2E
NOT TOOL-EXECUTED.
The available tool surface does not provide a real browser session for clicking through the rendered admin panel. This remains a launch-gate residual.

## Residue
Regression fixtures are transactional and rolled back. Production remains untouched.
