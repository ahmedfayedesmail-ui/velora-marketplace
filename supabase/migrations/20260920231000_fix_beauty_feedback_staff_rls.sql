-- Velora Sprint 1 Beauty MVP Phase A
-- Fix Restore-Test staff-read policy to use the established private staff guard.
-- The public wrapper is SECURITY INVOKER and cannot access the private schema
-- when called from an authenticated RLS policy.

begin;

drop policy if exists beauty_feedback_staff_read on public.beauty_feedback;

create policy beauty_feedback_staff_read
on public.beauty_feedback
for select
to authenticated
using (private.velora_is_staff());

commit;