-- Retire the historical Paymob transaction processor from all API-facing/service execution.
-- Canonical Paymob webhook and reconciliation paths use
-- public.velora_apply_paymob_marketplace_transaction().
revoke execute on function public.velora_process_paymob_transaction_internal(jsonb)
from anon, authenticated, service_role;
