-- Keep the public beauty-context wrapper authenticated-only after converting it
-- to SECURITY DEFINER. The private helper remains non-public.
revoke execute on function public.velora_get_beauty_context() from anon;
grant execute on function public.velora_get_beauty_context() to authenticated;
