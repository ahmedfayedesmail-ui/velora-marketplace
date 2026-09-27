-- Restore-Test / audit branch only.
-- Staff RLS already constrains row visibility; grant the authenticated role
-- the SELECT privilege required by the Owner Legal & Trust admin view.
grant select on table public.legal_documents to authenticated;
