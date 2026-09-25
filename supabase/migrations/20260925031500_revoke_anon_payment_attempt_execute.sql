-- Harden payment attempt RPC exposure.
-- Marketplace payment attempts require an authenticated customer session.
revoke execute on function public.velora_create_payment_attempt(uuid, uuid, text, text, text) from public, anon;
grant execute on function public.velora_create_payment_attempt(uuid, uuid, text, text, text) to authenticated;
