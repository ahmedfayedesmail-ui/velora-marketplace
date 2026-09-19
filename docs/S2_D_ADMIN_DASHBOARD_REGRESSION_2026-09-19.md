# S2-D Admin Dashboard Regression Evidence
Date: 2026-09-19
Environment: Restore-Test only
Production: FROZEN

## Database authorization regression
PASS

Staff context:
- authenticated JWT subject: existing Restore-Test auth identity
- staff role supplied through public.user_roles
- velora_get_admin_dashboard() executed successfully
- returned object contains generated_at, users, sellers, products, orders, payments, payouts, reviews and attention sections
- recent_orders is JSON array
- recent_audit_logs is JSON array
- order_value_by_currency is JSON object

Non-staff context:
- authenticated caller without staff role was rejected with ADMIN_ACCESS_REQUIRED

Privilege/security:
- anon EXECUTE: false
- authenticated EXECUTE: true
- SECURITY DEFINER: true
- function search_path: empty
- no dashboard write RPC or client-side mutation is introduced

## Rollback verification
PASS
The rollback operation was executed transactionally by dropping public.velora_get_admin_dashboard() and then rolling back. The function was present again after rollback.

Rollback artifact:
docs/rollback/20260919061938_s2_d_admin_dashboard_readonly.rollback.sql

## Static integration
PASS
- branch: sprint-2-s2d-admin
- 56-s2d-admin.js: 9,863 chars
- manifest order 56: present and length-matched
- src/index.html: script 55 loads before script 56
- existing Admin Sellers/Products/Orders/Users/Coupons/Settings sections remain delegated to the legacy admin implementation
- S2-D dashboard adds read-only overview + refresh only

## Restore-Test migration identity
PASS
- canonical migration version recorded by Supabase: 20260919061938
- migration name: s2_d_admin_dashboard_readonly
- canonical repository migration file matches that version

## Residue
PASS
The authorization regression used transactional fixtures. No S2-D fixture rows persist after rollback.

## Production freeze
PASS
Production ref cogplqokzxqaedvjxbwu was checked after S2-D work:
- S2-B migrations 20260919054924 / 20260919055000 / 20260919055525: absent
- S2-E migration 20260919060045: absent
- S2-D migration 20260919061938: absent
- products: 1
- variants: 0
- reviews: 0
- wishlists: 0
- wishlist_items: 0
- notifications: 0

No Production migration was executed.

## Browser E2E
NOT TOOL-EXECUTED.
The available tool surface does not provide a genuine browser session for clicking through the rendered Admin UI. This remains the explicit pre-launch residual for Sprint 2.
