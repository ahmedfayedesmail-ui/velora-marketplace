-- VELORA — close direct staff writes on the canonical integration control plane
-- Governance rule: status changes must go through the guarded RPC path so
-- authorization and audit semantics remain centralized.

drop policy if exists integration_control_staff_write
on public.integration_control_plane;

-- Keep the existing staff SELECT policy intact.
