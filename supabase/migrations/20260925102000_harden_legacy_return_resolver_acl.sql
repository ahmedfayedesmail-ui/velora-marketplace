-- Restore-Test / staging only. Production remains frozen.
-- Remove execute access to the superseded 3-argument return resolver.
-- The canonical 6-argument resolver remains the only client-callable return
-- resolution surface and enforces the governed state machine + refund evidence.

REVOKE EXECUTE ON FUNCTION public.velora_resolve_return(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.velora_resolve_return(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.velora_resolve_return(uuid, text, text) FROM authenticated;
