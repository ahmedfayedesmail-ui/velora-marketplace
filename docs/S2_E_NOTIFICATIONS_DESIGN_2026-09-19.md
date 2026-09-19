# S2-E Notifications — Design & Engineering Decision Log
Date: 2026-09-19
Environment: Restore-Test only (arlaxqmhtvjwjbjinjfw)
Production: FROZEN

## Decision
Keep the existing single notifications table and existing bell/dropdown UI. Make Supabase the authoritative source of notification state and read state.

The runtime recipient identity is aligned to public.users.id because the application's current Auth/profile recovery writes authenticated identities into public.users and orders/sellers already use that identity.

## Scope
Included:
- Authenticated notification feed with unread badge.
- Mark one notification read.
- Mark all notifications read.
- Server-owned notification creation.
- Order placed and order-status notifications.
- New-user welcome notification.
- Seller approval/rejection notification.
- Product approval/rejection notification.
- Review notification routed through the central notification writer.
- Poll-based refresh every 30 seconds.

Not included:
- Push/email/SMS delivery.
- Full notification preference center.
- Broadcast/segmented notifications.
- Realtime channel dependency.
- Multi-channel notification orchestration.

## Security
- RLS remains enabled.
- Authenticated users can SELECT only their own notifications.
- anon has no direct notification table access.
- authenticated clients have no direct INSERT/UPDATE/DELETE on notifications.
- Read-state mutations use authenticated RPCs.
- Read functions are SECURITY INVOKER with empty search_path.
- Mutation/helper functions are SECURITY DEFINER with empty search_path and are not exposed to API roles.
- Notification payloads are server-generated; clients cannot forge arbitrary recipients.

## Event ownership
- Review: existing S2-C submit RPC calls the central private notification writer.
- Orders: database trigger owns placed/status-change notifications.
- Users: database trigger owns welcome notification.
- Sellers: database trigger owns approval/rejection notification.
- Products: database trigger owns approval/rejection notification.

Trigger notification failures are warning-only for order/user/seller/product events so notification delivery does not abort the business transaction.

## UI
Script 55 runs after S2-B script 54.
It replaces the legacy localStorage notification feed with DB-backed data while preserving the existing DOM/classes.
Authenticated state is loaded from Supabase session.
No notification state is stored as a local source of truth.

## Production gate
Restore-Test migration pass, notification regression pass, static script/manifest checks, rollback evidence, RLS/grant verification, and production-freeze verification are required before any Production consideration.
