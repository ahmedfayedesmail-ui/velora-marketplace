# S2-D Admin Dashboard - Design & Engineering Decision Log
Date: 2026-09-19
Environment: Restore-Test only (arlaxqmhtvjwjbjinjfw)
Production: FROZEN

## Decision
Add a read-only operational overview to the existing Admin Panel. Do not rebuild existing seller/product/order/user management screens.

The dashboard reads a single staff-gated Supabase RPC and presents:
- customer/seller/product/order counts
- seller/product/review/payment/payout attention counts
- order value grouped by currency (never summed across currencies)
- operational status breakdowns
- latest orders
- latest audit activity

Existing admin sections and their controls remain unchanged.

## Security
velora_get_admin_dashboard() is SECURITY DEFINER because it aggregates across protected tables. It uses search_path='', schema-qualified references, and a staff-role guard through private.velora_is_staff().
The RPC is executable only by authenticated; anon and public have no execute privilege.
No client-side admin trust is used for the data returned by the dashboard.

## Scope boundaries
Included: dashboard overview and refresh.
Excluded: admin rebuild, destructive moderation actions, role management, account banning, payout execution, payment mutation, notification preference management.

## Production gate
Restore-Test migration pass, staff/non-staff authorization regression, static script/manifest checks, rollback evidence, and production-freeze verification are required before Production consideration.
