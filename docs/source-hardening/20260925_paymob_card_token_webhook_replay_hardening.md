# Paymob Card Token Webhook Hardening — 2026-09-25

Scope: Restore-Test only.

## Changes

- Kept Paymob card-token callback behind custom HMAC verification because the provider callback is external.
- Uses the documented signed callback `order_id` to resolve the tokenization session.
- Adds webhook event fingerprinting using `paymob_token_<token_id>`.
- Same event id + same payload hash is a no-op only after the event is marked processed.
- Same event id + different payload hash returns `409 WEBHOOK_EVENT_PAYLOAD_MISMATCH`.
- Verified-but-not-processed callbacks remain retryable after partial processing failure.
- Token storage RPC remains service_role-only.

## Verification

- Edge Function: `velora-paymob-card-token-webhook-restore-test-7b`
- Version: 5 ACTIVE
- `verify_jwt=false` retained for external HMAC-authenticated provider callbacks.
- Token storage RPC ACL: anon=false, authenticated=false, service_role=true.
- No existing Paymob TOKEN webhook events were present in Restore-Test at verification time.

## Deployment boundary

Production was not modified. Promotion requires explicit production-unfreeze approval and live provider callback verification.
