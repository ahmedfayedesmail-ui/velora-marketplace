-- Extend canonical payment_attempts domain for seller-paid advertising add-ons.
alter table public.payment_attempts
  drop constraint if exists payment_attempts_purpose_check;
alter table public.payment_attempts
  add constraint payment_attempts_purpose_check
  check (purpose = any (array['marketplace_order'::text,'subscription'::text,'seller_ad'::text]));

alter table public.payment_attempts
  drop constraint if exists payment_attempts_purpose_reference_domain_check;
alter table public.payment_attempts
  add constraint payment_attempts_purpose_reference_domain_check
  check (
    (purpose='marketplace_order' and order_id is not null and seller_subscription_id is null and seller_ad_campaign_id is null)
    or
    (purpose='subscription' and order_id is null and seller_subscription_id is not null and seller_ad_campaign_id is null)
    or
    (purpose='seller_ad' and order_id is null and seller_subscription_id is null and seller_ad_campaign_id is not null)
  );