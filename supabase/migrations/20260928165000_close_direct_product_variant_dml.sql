-- Close direct product-variant table DML for signed-in clients.
-- Variant writes already use governed RPCs.
-- Restore-Test/audit branch; Production remains FROZEN.

revoke insert, update, delete on public.product_variants from anon, authenticated;