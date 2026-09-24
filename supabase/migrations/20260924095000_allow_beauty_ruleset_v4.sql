-- Allow the active routine ruleset version while preserving historical runs.
-- Restore-Test / staging only.
alter table public.beauty_routine_runs
  drop constraint if exists beauty_routine_runs_ruleset_version_check;

alter table public.beauty_routine_runs
  add constraint beauty_routine_runs_ruleset_version_check
  check (ruleset_version = any (array['beauty-rules.v2','beauty-rules.v3','beauty-rules.v4']::text[]));

