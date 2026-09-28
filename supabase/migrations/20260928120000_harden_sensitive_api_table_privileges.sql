-- Restore-Test only. Production remains frozen.
-- API roles keep their existing SELECT paths, but must not mutate
-- financial/commercial tables directly. All writes remain behind
-- authenticated/Staff/Owner/service RPC contracts.

revoke insert, update, delete, truncate, references, trigger, maintain
on table
  public.orders,
  public.order_items,
  public.commissions,
  public.payments,
  public.payment_attempts,
  public.gift_cards,
  public.gift_card_transactions,
  public.coupons,
  public.coupon_redemptions,
  public.promotions,
  public.promotion_redemptions,
  public.seller_subscriptions,
  public.payouts
from anon, authenticated;
