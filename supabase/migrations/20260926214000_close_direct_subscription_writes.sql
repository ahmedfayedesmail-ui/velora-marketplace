-- VELORA — close legacy direct seller subscription mutations
-- Subscription lifecycle mutations are governed by canonical purchase, payment,
-- renewal and synchronization functions. No direct staff table mutation policy
-- is required for the current runtime path.

drop policy if exists velora_subscription_staff_write on public.seller_subscriptions;
