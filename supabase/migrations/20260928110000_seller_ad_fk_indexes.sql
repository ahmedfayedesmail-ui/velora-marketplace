-- VELORA — Seller Advertising FK Index Completion
-- Cover only foreign keys introduced by the seller advertising contract.

create index if not exists seller_ad_campaigns_store_idx
  on public.seller_ad_campaigns(store_id, created_at desc);

create index if not exists seller_ad_campaigns_package_idx
  on public.seller_ad_campaigns(ad_package_id, status, starts_at, ends_at);