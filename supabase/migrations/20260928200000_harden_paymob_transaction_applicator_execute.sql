-- SECURITY: keep the canonical Paymob marketplace transaction applicator
-- callable only by the backend service identity.
revoke execute on function public.velora_apply_paymob_marketplace_transaction(uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.velora_apply_paymob_marketplace_transaction(uuid,text,text,text)
  to service_role;
