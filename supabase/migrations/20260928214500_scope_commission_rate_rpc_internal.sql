-- Scope commission-rate lookup to internal canonical financial execution.
-- The canonical order creation path calls this function as SECURITY DEFINER.
-- No customer-facing feature requires arbitrary seller commission-rate lookup.
-- Production remains FROZEN.

revoke execute on function public.velora_get_commission_rate(uuid)
  from anon, authenticated;

comment on function public.velora_get_commission_rate(uuid)
is 'INTERNAL FINANCIAL CALCULATION. Canonical order/commercial paths may call this SECURITY DEFINER function; arbitrary client execution is not a supported customer-facing contract.';
