# S2-A Rollback Reference — 20260918194021

Restore-Test only. Production: FROZEN.

Reverse only objects introduced by S2-MIG-01:
- product_variants.is_active
- order_items.product_variant_name
- order_items.product_variant_attributes
- idx_variants_active_product
- S2-A variant/cart/order helper functions and policies.

The historical SQL body is not retrievable from Supabase migration history. Before inverse execution, use the recorded S2-A preflight snapshot to restore exact prior function definitions and verify schema/policy identity. Then run zero-residue checks and confirm Production remains unchanged.
