-- Velora Sprint 1 / B5
-- Least-privilege hardening for persisted recommendation reads.
-- Production remains FROZEN.

revoke select on public.beauty_recommendation_runs from authenticated;
grant select (id, user_id, ruleset_version, catalog_revision, created_at)
  on public.beauty_recommendation_runs to authenticated;

revoke select on public.beauty_recommendation_items from authenticated;
grant select (id, run_id, product_id, product_variant_id, position, score, reason_codes, created_at)
  on public.beauty_recommendation_items to authenticated;

revoke select on public.beauty_recommendation_runs from anon;
revoke select on public.beauty_recommendation_items from anon;
