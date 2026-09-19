# S2-B Wishlist Regression Evidence
Date: 2026-09-19
Environment: Restore-Test only
Production: FROZEN

## Database behavioral regression
PASS.
- Authenticated customer can add an approved product through velora_toggle_wishlist().
- Toggle remove returns the wishlist to zero.
- velora_merge_wishlist() is additive and duplicate-safe; repeated IDs do not create duplicate wishlist_items.
- Unapproved/pending products are rejected by server-side PRODUCT_NOT_AVAILABLE validation.
- velora_get_wishlist() returns canonical approved-product data only.

## Security / RLS
PASS.
- wishlists: exactly one authenticated SELECT policy scoped to auth.uid().
- wishlist_items: exactly one authenticated SELECT policy scoped through the owning wishlist.
- anon has no table privileges on either wishlist table.
- authenticated has SELECT only; direct insert/update/delete privileges are removed.
- anon EXECUTE is false for all S2-B wishlist RPCs.
- authenticated EXECUTE is true for get/toggle/merge.
- velora_get_wishlist() is SECURITY INVOKER with search_path=''.
- write RPCs are SECURITY DEFINER with search_path='' and schema-qualified references.

## Residue
PASS.
- wishlists: 0
- wishlist_items: 0
- S2-B regression products: 0
- S2-B regression profile: 0

## Frontend
PASS (static integration review).
- 54-s2b-wishlist.js is loaded after S2-C.
- Authenticated wishlist writes wait for authoritative RPC success before changing UI state.
- Guest wishlist is device-local and merged on sign-in.
- Guest wishlist lifecycle was corrected so sign-out clears account state without deleting the device-local guest cache.
- Script manifest was refreshed to the final script length.

## Browser E2E
NOT TOOL-EXECUTED.
The available tool surface does not provide a real browser session for clicking through the rendered marketplace. This remains a launch-gate residual; DB/RLS behavior and static integration are verified.

## GitHub
Branch: sprint-2-s2b-wishlist
Latest implementation head: 4111160d5646471dc4361336ed17aaea03279b6d (manifest refresh)
S2-B migrations mirrored:
- 20260919054924 — preflight no-op marker
- 20260919055000 — authoritative path contract
- 20260919055525 — privilege hardening
Rollback artifacts are present for each migration.

## Production verification
Production remains FROZEN and unchanged by S2-B.
Observed Production counts at verification: products=1, variants=0, reviews=0, wishlists=0, wishlist_items=0.
