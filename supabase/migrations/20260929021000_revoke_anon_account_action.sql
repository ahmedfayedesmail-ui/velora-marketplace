-- Velora Restore-Test only.
-- velora_account_action is a privileged write surface. Canonical frontend
-- callers are authenticated staff/owner flows, so anonymous EXECUTE is not
-- required. Keep authenticated/service_role execution unchanged.

revoke execute on function public.velora_account_action(
  uuid,text,text,integer,jsonb
) from public, anon;
