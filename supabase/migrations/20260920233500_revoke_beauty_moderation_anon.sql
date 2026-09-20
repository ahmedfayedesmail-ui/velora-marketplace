-- Explicitly remove anonymous EXECUTE on the staff-only Beauty moderation RPC.
begin;
revoke execute on function public.velora_moderate_beauty_feedback(uuid,text,text) from anon;
grant execute on function public.velora_moderate_beauty_feedback(uuid,text,text) to authenticated;
commit;