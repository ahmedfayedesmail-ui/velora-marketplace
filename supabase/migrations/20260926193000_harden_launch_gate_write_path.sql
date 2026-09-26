-- VELORA — close direct writes on canonical launch gates
-- Gate state is evidence-derived by velora_run_launch_gate_audit().
-- Keep staff SELECT access; remove browser/API direct mutation.

drop policy if exists velora_launch_gates_staff_modify
on public.velora_launch_gates;
