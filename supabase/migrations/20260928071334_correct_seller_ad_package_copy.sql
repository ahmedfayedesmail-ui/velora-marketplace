-- VELORA — Correct seller ad package copy to match implemented placement semantics.
-- No category targeting or bid-priority guarantee exists in the current MVP renderer.

update public.seller_ad_packages
set description='Featured sponsored placement in the marketplace shop for 7 days.',
    updated_at=now()
where code='featured_product_7d';