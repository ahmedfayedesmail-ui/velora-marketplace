-- Restore-Test hardening: these are trigger/internal helpers, not API RPCs.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.velora_automation_from_payment() from public, anon, authenticated;
revoke execute on function public.velora_automation_from_reconciliation() from public, anon, authenticated;
revoke execute on function public.velora_reconcile_automation_event(uuid) from public, anon, authenticated;
revoke execute on function public.velora_record_webhook_event_internal(text,text,text,text,boolean,text,jsonb) from public, anon, authenticated;
revoke execute on function public.velora_remove_push_subscription(uuid) from public, anon, authenticated;
