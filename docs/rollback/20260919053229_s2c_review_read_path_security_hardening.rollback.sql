-- Rollback S2-C read-path security hardening.
ALTER FUNCTION public.velora_get_product_reviews(uuid,integer,integer) SECURITY DEFINER;
ALTER FUNCTION public.velora_get_product_review_summary(uuid) SECURITY DEFINER;
ALTER FUNCTION public.velora_get_review_eligibility(uuid) SECURITY DEFINER;
ALTER FUNCTION public.velora_get_seller_reviews(integer,integer,text) SECURITY DEFINER;
ALTER FUNCTION public.velora_get_review_moderation_queue(text,integer,integer) SECURITY DEFINER;
