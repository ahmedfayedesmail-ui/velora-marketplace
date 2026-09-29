-- VELORA — Keep private Routine operation behind canonical public entry point.
-- Restore-Test hardening; Production remains frozen.

revoke execute on function private.velora_beauty_routine_operation() from anon, authenticated;