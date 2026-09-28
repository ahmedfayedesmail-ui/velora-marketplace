-- The subscription expiry helper is an internal lifecycle primitive.
-- Keep it callable by trusted database execution paths only; it is not a client API.

revoke execute on function public.velora_schedule_subscription_expiry_notification_jobs(uuid)
  from public, anon, authenticated;