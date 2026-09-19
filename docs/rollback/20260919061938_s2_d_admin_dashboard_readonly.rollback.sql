-- Rollback for 20260919061938_s2_d_admin_dashboard_readonly
-- Removes only the S2-D dashboard RPC.

drop function if exists public.velora_get_admin_dashboard();
