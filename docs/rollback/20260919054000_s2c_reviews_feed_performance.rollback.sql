-- Rollback S2-C published review feed performance.
drop function if exists public.velora_get_published_reviews_feed(integer,integer);
drop index if exists public.idx_reviews_published_created_at;
