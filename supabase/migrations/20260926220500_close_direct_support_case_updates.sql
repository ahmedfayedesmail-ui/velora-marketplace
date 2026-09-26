-- VELORA — close direct support-case updates
-- Case creation remains customer-owned. Case updates must use the governed
-- RPC, which validates status/assignment fields and records an audit event.

drop policy if exists support_cases_update_staff_or_owner on public.support_cases;
