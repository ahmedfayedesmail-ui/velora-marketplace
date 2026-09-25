-- Restore-Test: internal snapshot/reconciliation surfaces are not direct API write targets.
revoke all on table public.reconciliation_runs from anon;
revoke all on table public.reconciliation_findings from anon;
revoke all on table public.observability_runs from anon;
revoke all on table public.observability_measurements from anon;
revoke all on table public.marketplace_finops_snapshots from anon;
revoke all on table public.growth_intelligence_snapshots from anon;

revoke insert, update, delete, truncate, references, trigger on table public.reconciliation_runs from authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.reconciliation_findings from authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.observability_runs from authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.observability_measurements from authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.marketplace_finops_snapshots from authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.growth_intelligence_snapshots from authenticated;
