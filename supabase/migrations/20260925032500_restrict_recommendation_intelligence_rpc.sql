-- Restrict legacy/internal recommendation intelligence aggregation.
-- The function exposes cross-customer operational metrics and has no actor check.
-- It is not part of the current customer recommendation read contract.
revoke execute on function public.velora_get_recommendation_intelligence() from public, anon, authenticated;
grant execute on function public.velora_get_recommendation_intelligence() to service_role;
