-- Close direct product-table DML for signed-in clients.
-- Product writes must go through governed canonical RPCs.
-- Restore-Test/audit branch; Production remains FROZEN.

revoke insert, update, delete on public.products from anon, authenticated;