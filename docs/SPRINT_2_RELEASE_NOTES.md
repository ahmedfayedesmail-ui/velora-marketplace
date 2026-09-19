# Velora Sprint 2 Release Notes

## S2-A — Product Variants

Status: **CLOSED**

SQL-level authenticated E2E/RLS gate: **PASS** on Restore-Test.

Browser E2E: **NOT TESTED** and retained as an explicit residual. This must be completed before any Production launch gate is approved.

Six Restore-Test runtime hotfixes discovered during the E2E gate were promoted to versioned migration files on branch `sprint-2-s2a-variants`, each with a rollback artifact.

Production remains **FROZEN**. No Production migration was executed.

## S2-C — Reviews + Ratings

Discovery may proceed after S2-A closure. Implementation remains subject to the Sprint 2 sequencing and Restore-Test-first gate.

## S2-C — Reviews + Ratings

Engineering implementation is active on Restore-Test. Product decisions are owned by the engineering track unless a business/legal decision is required.

Current backend gate: PASS for DB/RLS review lifecycle regression.

Browser E2E: NOT TESTED and remains a Production-launch residual.

Production remains FROZEN.

## S2-B — Wishlist

Status: **Implementation + DB regression PASS**

Restore-Test used the existing `wishlists` + `wishlist_items` subsystem as the authoritative account wishlist. Authenticated writes are RPC-only; direct table DML was removed for API roles. Guest wishlist state is merged into the authenticated wishlist after sign-in.

Migration sequence:
- `20260919054924_s2_b_wishlist_preflight_noop` — recorded no-op preflight marker.
- `20260919055000_s2_b_wishlist_authoritative_path_contract`
- `20260919055525_s2_b_wishlist_privilege_hardening`

Static JS/manifest checks: **PASS**.
Wishlist regression: **PASS**.
Browser E2E: **NOT TESTED** and remains a Production-launch residual.
Production remains **FROZEN**.

## S2-E — Notifications

Status: **Implementation + DB regression PASS**

Restore-Test migration:
- `20260919060045_s2e_notifications_foundation`

Notifications now use Supabase as source of truth with:
- authenticated read feed + unread count
- mark-one / mark-all read RPCs
- server-owned notification writer
- welcome, order, order-status, seller-status, product-status and review notification events
- RLS owner isolation and RPC-only client writes
- 30-second polling in the legacy-compatible UI adapter

The notifications recipient FK is aligned to the runtime identity `public.users(id)`. Restore-Test had zero notification rows before the FK change; Production was inspected and also had zero notification rows plus zero profiles-not-in-users mismatch.

Security/RLS regression: **PASS**.
Review -> seller notification integration: **PASS**.
Seller/product status trigger integration: **PASS**.
Static JS/manifest checks: **PASS**.
Browser E2E: **NOT TESTED** and remains a Production-launch residual.
Production remains **FROZEN**.

