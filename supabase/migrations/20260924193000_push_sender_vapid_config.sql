-- Velora Push Sender: service-role-only access to VAPID config.
-- Secrets are stored in Supabase Vault:
--   velora_vapid_public_key
--   velora_vapid_private_key
--   velora_vapid_subject

create or replace function public.velora_get_push_sender_config()
returns table (
  vapid_public_key text,
  vapid_private_key text,
  vapid_subject text
)
language sql
security definer
set search_path = public, vault
as $$
  select
    max(decrypted_secret) filter (where name = 'velora_vapid_public_key'),
    max(decrypted_secret) filter (where name = 'velora_vapid_private_key'),
    max(decrypted_secret) filter (where name = 'velora_vapid_subject')
  from vault.decrypted_secrets
  where name in (
    'velora_vapid_public_key',
    'velora_vapid_private_key',
    'velora_vapid_subject'
  )
    and coalesce(auth.role(), '') = 'service_role';
$$;

revoke all on function public.velora_get_push_sender_config() from public;
revoke all on function public.velora_get_push_sender_config() from anon, authenticated;
grant execute on function public.velora_get_push_sender_config() to service_role;
