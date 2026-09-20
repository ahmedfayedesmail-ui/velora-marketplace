-- Velora Sprint 1 Beauty MVP Phase A
-- Consolidate Beauty feedback SELECT access into one permissive policy.

begin;

drop policy if exists beauty_feedback_self_read on public.beauty_feedback;
drop policy if exists beauty_feedback_staff_read on public.beauty_feedback;

create policy beauty_feedback_select
on public.beauty_feedback
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (
    (select auth.uid()) = user_id
    or private.velora_is_staff()
  )
);

commit;