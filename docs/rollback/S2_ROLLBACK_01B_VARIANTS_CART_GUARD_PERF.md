# S2-A Rollback Reference — 20260918195034

Restore-Test only. Production: FROZEN.

Drop only:
- idx_cart_items_product_variant_id
- idx_order_items_product_variant_id

Restore public.velora_set_cart_quantity_variant(uuid,uuid,integer) to the exact pre-01B definition captured immediately before migration. Verify both indexes are absent and no unrelated object/RLS state changed.
