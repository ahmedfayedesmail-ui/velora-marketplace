# Paymob Callback Correlation Hardening — 2026-09-25

Scope: Restore-Test only. Production remains frozen.

## Finding
The Paymob transaction HMAC covers the documented transaction fields, including order.id, but not merchant callback extras. Velora previously used payment_key_claims.extra.velora_payment_attempt_id / velora_order_id as the primary callback correlation.

Paymob documents order.id as the Paymob Order ID returned in transaction callbacks and recommends using it to correlate the transaction to the merchant order.

## Remediation
1. Restore-Test checkout now captures intention_order_id from the Paymob Intention response.
2. The authenticated payment-session attachment RPC accepts a Paymob provider Order ID and stores it in payment_attempts.metadata.paymob_order_id.
3. Restore-Test Paymob transaction webhook now:
   - requires the signed Paymob order.id;
   - resolves marketplace payment attempts by metadata.paymob_order_id;
   - cross-checks any callback extra payment-attempt ID against the database-resolved attempt;
   - derives the Velora order from the resolved payment attempt instead of trusting unsigned callback extras for order mutation.
4. Internal callback helper RPCs remain service-role-only.

## Verification
- Restore-Test Paymob webhook: active, version 12, custom HMAC verification retained.
- Restore-Test Paymob checkout: active, version 8, JWT required.
- Internal payment callback RPCs verified: anon=false, authenticated=false, service_role=true.
- Branch migrations committed on sprint-2-s2d-admin.
