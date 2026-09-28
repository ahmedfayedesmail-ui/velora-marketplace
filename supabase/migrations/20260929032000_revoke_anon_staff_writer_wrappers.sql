-- Velora Restore-Test only.
-- These are authenticated staff-side operations. Anonymous callers have no
-- legitimate path and must not retain Data API EXECUTE.

revoke execute on function public.velora_record_fraud_event(
  uuid,uuid,uuid,text,numeric,text,jsonb
) from public, anon;

revoke execute on function public.velora_review_seller_application(
  uuid,text,text
) from public, anon;
