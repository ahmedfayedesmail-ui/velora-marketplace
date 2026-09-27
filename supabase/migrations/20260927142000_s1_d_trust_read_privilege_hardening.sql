-- Trust & Compliance read-path privilege hardening
-- Restore-Test / audit branch only.
-- RLS policies already constrain row visibility; this grants the authenticated
-- role the SELECT privilege required for PostgREST reads used by the Trust UI.

grant select on table
  public.privacy_requests,
  public.disputes,
  public.returns,
  public.invoices
to authenticated;
