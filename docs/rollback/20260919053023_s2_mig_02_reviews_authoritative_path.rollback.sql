-- Rollback S2-C authoritative review path. Preserves review rows.
drop trigger if exists trg_reviews_refresh_aggregates on public.reviews;
drop function if exists private.velora_reviews_refresh_aggregates_trg();
drop function if exists private.velora_refresh_review_aggregates(uuid);
drop function if exists public.velora_moderate_review(uuid,text);
drop function if exists public.velora_get_review_moderation_queue(text,integer,integer);
drop function if exists public.velora_get_seller_reviews(integer,integer,text);
drop function if exists public.velora_submit_review(uuid,uuid,smallint,text,text);
drop function if exists public.velora_get_review_eligibility(uuid);
drop function if exists public.velora_get_product_review_summary(uuid);
drop function if exists public.velora_get_product_reviews(uuid,integer,integer);
drop policy if exists velora_reviews_seller_read on public.reviews;
drop index if exists public.idx_reviews_product_status_created_at;
drop index if exists public.idx_reviews_order_item_customer;
drop index if exists public.idx_reviews_customer_product_status;
