-- Velora Sprint 1 Beauty MVP Phase A
-- Add covering indexes for Beauty foreign keys.
begin;
create index if not exists beauty_feedback_moderated_by_idx
  on public.beauty_feedback(moderated_by);
create index if not exists beauty_feedback_product_variant_idx
  on public.beauty_feedback(product_variant_id);
create index if not exists beauty_recommendation_items_product_variant_idx
  on public.beauty_recommendation_items(product_variant_id);
commit;