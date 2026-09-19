# S2-A Rollback Reference — 20260918194243

Restore-Test only. Production: FROZEN.

Restore the pre-01A definition of public.velora_get_product_variants(uuid) captured during S2-A preflight.
Verify approved-product public reads remain active-only, seller-owner reads of own pending/approved products behave as pre-01A, and non-owner pending reads remain isolated.
