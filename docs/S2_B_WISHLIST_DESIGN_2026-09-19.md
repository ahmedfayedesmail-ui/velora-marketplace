# S2-B Wishlist — Design & Engineering Decision Log
Date: 2026-09-19
Environment: Restore-Test only (arlaxqmhtvjwjbjinjfw)
Production: FROZEN

## Decision
Keep the existing single-list wishlist model (wishlists + wishlist_items) and harden it instead of introducing a second wishlist subsystem.

Authenticated customers use Supabase as the source of truth. Guests may use a device-local compatibility cache until sign-in. On sign-in, the guest list is merged into the account with one RPC; successful merge clears the guest cache. There is no multi-wishlist feature in Sprint 2.

## Security
Client writes are RPC-only. Direct INSERT/UPDATE/DELETE privileges on wishlist tables are removed for anon and authenticated.
velora_get_wishlist() is SECURITY INVOKER with empty search_path.
velora_toggle_wishlist() and velora_merge_wishlist() are SECURITY DEFINER only because they perform controlled cross-table writes; they use search_path='' with schema-qualified references, explicit authenticated EXECUTE grants, and server-side approved-product validation.
RLS is consolidated to one authenticated SELECT policy per wishlist table.

## Behavior
One wishlist per customer.
Adding/removing is concurrency-safe at the per-customer wishlist row.
Only approved products can be saved.
Hidden or unapproved products are excluded from the read feed.
Guest-to-account merge is additive and preserves existing account items.
Maximum merge payload: 200 product IDs.
No notifications, multi-wishlist or shared wishlist features are introduced.

## UI
Script 54 runs after S2-C and overrides the legacy favorite handler.
Authenticated writes wait for authoritative RPC success before changing UI state.
Guest writes remain local-only.
The wishlist page is DB-backed after sign-in and can render canonical product data not previously present in the local catalog.
The classic script order is preserved.

## Production gate
Restore-Test migration pass, wishlist behavioral regression pass, static JS and manifest checks, rollback evidence, RLS and privilege checks, and production-freeze verification are required before any Production consideration.
