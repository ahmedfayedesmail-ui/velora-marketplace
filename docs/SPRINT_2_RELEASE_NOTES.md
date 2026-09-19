# Velora Sprint 2 Release Notes

## S2-A - Product Variants
Status: CLOSED
SQL-level authenticated E2E/RLS gate: PASS on Restore-Test.
Browser E2E: NOT TESTED; retained as a Production-launch residual.
Production remains FROZEN.

## S2-C - Reviews + Ratings
Status: Backend/RLS implementation complete for Sprint 2 scope.
DB regression: PASS on Restore-Test.
Browser E2E: NOT TESTED; retained as a Production-launch residual.
Production remains FROZEN.

## S2-B - Wishlist
Status: DB + static regression PASS.
Existing wishlists + wishlist_items remain the single account wishlist subsystem.
Authenticated direct table writes are denied; wishlist mutations use authenticated RPCs.
Guest wishlist state is device-local until sign-in and then merged into the account.
Migrations:
- 20260919054924 - preflight marker
- 20260919055000 - authoritative path contract
- 20260919055525 - privilege hardening
Browser E2E: NOT TESTED; retained as a Production-launch residual.
Production remains FROZEN.

## S2-E - Notifications
Status: DB + static regression PASS.
Migration: 20260919060045 - notifications foundation
Supabase is the source of truth for notification feed/read state.
Client notification DML is denied; authenticated feed and read-state RPCs are used.
Server-owned notification events cover welcome, orders/order-status, seller/product status and reviews.
Browser E2E: NOT TESTED; retained as a Production-launch residual.
Production remains FROZEN.

## S2-D - Admin Dashboard
Status: Implementation + authorization regression PASS.
Migration: 20260919062000 - read-only admin dashboard RPC
The dashboard is a staff-gated read-only operational overview and does not rebuild existing admin management sections.
Order value is grouped by currency.
Rollback verification: PASS.
Browser E2E: NOT TESTED; retained as a Production-launch residual.
Production remains FROZEN.

## Sprint 2 Engineering Closure
Engineering scope is complete across S2-A, S2-B, S2-C, S2-D and S2-E on Restore-Test, subject to the documented browser E2E residual.
Production has remained untouched throughout Sprint 2 feature work.
There is no Production GO in these notes.
Remaining launch gate: execute authenticated browser E2E across the Sprint 2 surface, then perform final Production change-control review and explicit Owner GO.
