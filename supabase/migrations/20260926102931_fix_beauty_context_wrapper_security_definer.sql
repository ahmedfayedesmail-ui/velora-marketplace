-- Restore-Test evidence fix: the public wrapper calls a private SECURITY DEFINER helper
-- that is not executable by authenticated users. Keep the wrapper as the narrow
-- authenticated entry point and avoid granting the private helper directly.
alter function public.velora_get_beauty_context() security definer;
