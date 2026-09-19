# S2-C Reviews + Ratings — Engineering Design

Status: Implementation active on Restore-Test; Production remains frozen.

## Product decisions

1. A review is allowed only when the authenticated customer has a delivered order containing the target product and the specific order item has not already been reviewed.
2. One review is allowed per purchased order item. Repeat purchases can therefore produce separate reviews.
3. The server validates rating 1–5, content 10–2000 characters, and title up to 150 characters.
4. The server derives is_verified_purchase=true; the client cannot choose or override it.
5. New reviews enter pending. Only staff can change moderation state.
6. Only published reviews are public and contribute to product/seller aggregates.
7. Product and seller aggregate fields are recalculated by a database trigger on review insert/update/delete.
8. Seller notification is created in public.notifications by the authoritative review writer. S2-E will standardize the broader notification source-of-truth path.
9. Public reviewer identity is reduced to Customer; public read RPCs do not expose customer UUIDs.
10. Browser E2E remains a launch residual. SQL/RLS coverage is the current implementation gate.

## Security model

Write operations are controlled RPCs. SECURITY DEFINER is used only where required for cross-table writes and aggregate maintenance, with search_path pinned to an empty string and schema-qualified references. Read RPCs are SECURITY INVOKER. Execute grants are explicit.

## UI ownership

53-s2c-reviews.js wraps the existing classic-script architecture rather than refactoring the baseline. It replaces review persistence with DB RPCs, adds product-detail reviews, seller review visibility, and staff moderation UI while preserving script order.

Legacy localStorage review helpers remain in the historical script for compatibility, but are not used by the S2-C write path.
