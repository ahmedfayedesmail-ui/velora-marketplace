-- Velora Sprint 1 / Phase C
-- Routine table ACL hardening.
-- Restore-Test only. Production remains FROZEN.
--
-- Reason: project-level default privileges may grant broad rights to
-- authenticated on newly-created public tables. Routine tables are
-- read-only from the client; writes will be owned by the future
-- server-side Routine operation.

begin;

revoke all on public.beauty_routine_runs from public, anon, authenticated;
revoke all on public.beauty_routine_steps from public, anon, authenticated;

grant select on public.beauty_routine_runs to authenticated;
grant select on public.beauty_routine_steps to authenticated;

commit;
