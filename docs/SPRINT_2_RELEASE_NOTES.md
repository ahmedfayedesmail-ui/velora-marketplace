# Velora Sprint 2 Release Notes

## S2-A - Product Variants
Status: CLOSED
SQL-level authenticated E2E/RLS gate: PASS on Restore-Test.
Browser E2E: NOT TESTED; retained as a Production-launch residual.
Production remains FROZEN.

## S2-C - Reviews + Ratings
Backend DB/RLS regression: PASS on Restore-Test.
Browser E2E: NOT TESTED; retained as a Production-launch residual.
Production remains FROZEN.

## S2-B - Wishlist
Status: DB + static regression PASS
Restore-Test uses the existing wishlists + wishlist_items subsystem as the authoritative account wishlist. Authenticated writes are RPC-only; guest state is local until sign-in and then merged.
Migrations:
- 20260919054924 - preflight marker
- 20260919055000 - authoritative path
- 20260919055525 - privilege hardening
Browser E2E: NOT TESTED; retained as a Production-launch residual.
Production remains FROZEN.

## S2-E - Notifications
Status: DB + static regression PASS
Migration:
- 20260919060045 - notifications foundation
Supabase is the source of truth for notification feed/read state. Client direct DML is denied; authenticated read/read-state RPCs are used. Server-owned events cover user welcome, orders, seller/product status and reviews.
Browser E2E: NOT TESTED; retained as a Production-launch residual.
Production remains FROZEN.

## S2-D - Admin Dashboard
Status: Restore-Test implementation + authorization regression PASS
Migration:
- 20260919062000 - read-only admin dashboard RPC
Dashboard is read-only and does not rebuild existing management sections.
Order value is grouped by currency.
Browser E2E: NOT TESTED; retained as a Production-launch residual.
Production remains FROZEN.

## Sprint 2 overall gate
All Sprint 2 DB/static tracks are complete enough for final closure review. Browser E2E across the Sprint 2 surface remains the explicit pre-launch residual. No Production migration or provider activation is authorized by these notes.
