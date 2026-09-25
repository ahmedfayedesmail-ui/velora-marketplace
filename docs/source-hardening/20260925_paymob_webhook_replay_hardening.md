# Paymob Webhook Replay Hardening — 2026-09-25

Scope: Restore-Test only.

## Changes

- Paymob transaction callbacks remain HMAC-verified.
- Callback correlation uses the signed Paymob transaction `order.id` and the stored `payment_attempts.metadata.paymob_order_id` binding.
- Payment status transitions are monotonic for terminal states so stale callbacks cannot regress a payment attempt.
- Marketplace order payment state is derived from the effective payment-attempt state.
- Webhook events are idempotent on `(provider_code,event_id)`.
- A repeated event with the same payload hash is treated as a no-op only after the event is marked `processed`.
- A repeated event with the same event id but a different payload hash is rejected with `409 WEBHOOK_EVENT_PAYLOAD_MISMATCH`.
- A verified-but-not-processed event remains retryable after a partial processing failure.

## Verification

- Restore-Test Edge Function `velora-paymob-webhook-restore-test`: version 16, ACTIVE, `verify_jwt=false` because Paymob callbacks use custom HMAC verification.
- Internal processor `velora_process_paymob_transaction_internal(jsonb)`: service_role-only.
- Restore-Test currently has 0 rows in `payment_attempts`; no existing payment business data was modified by this hardening.
- Database migration recorded as `20260925032737_harden_legacy_paymob_processor_correlation`.
- GitHub migration source recorded under `supabase/migrations/20260925042000_harden_legacy_paymob_processor_correlation.sql`.

## Deployment boundary

Production was not modified. These changes are Restore-Test hardening intended for later promotion after explicit production-unfreeze approval and live callback verification.
