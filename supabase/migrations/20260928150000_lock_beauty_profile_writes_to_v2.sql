-- VELORA — Prevent direct Data API reintroduction of Beauty Passport V1.
-- Restore-Test only; Production remains frozen.
-- V2 save remains SECURITY INVOKER and therefore keeps its required table grants.
-- RLS constrains direct client writes to the canonical V2 contract.
drop policy if exists beauty_profiles_self_insert on public.beauty_profiles;
create policy beauty_profiles_self_insert
on public.beauty_profiles
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid())=user_id
  and quiz_version='beauty-quiz.v2'
);

drop policy if exists beauty_profiles_self_update on public.beauty_profiles;
create policy beauty_profiles_self_update
on public.beauty_profiles
for update
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid())=user_id
)
with check (
  (select auth.uid()) is not null
  and (select auth.uid())=user_id
  and quiz_version='beauty-quiz.v2'
);
