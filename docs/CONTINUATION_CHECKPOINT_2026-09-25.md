# Velora Continuation Checkpoint — 2026-09-25

Environment: Restore-Test / staging only. Production remains frozen.

## Observed facts

- Branch: `sprint-2-s2d-admin`
- Latest verified Vercel deployment:
  - deployment: `dpl_4bEhRr4cxK3KjmRs3nCniJRxxuTX`
  - commit: `f41f909c51303e085533f5cc9c558e5aa5baa849`
  - state: READY
- Preview root responds HTTP 200.
- `src/scripts/13-payments.js` syntax check: PASS.
- `src/scripts/57-s2-checkout-e2e.js` syntax check: PASS.
- `src/scripts/62-s1-c-routine-cart.js` syntax check: PASS.
- `src/scripts/69-s1-d-seller-onboarding.js` syntax check: PASS.
- `src/scripts/70-s1-d-trust-operations.js` syntax check: PASS.

## Checkout hardening

- Removed legacy `oldPlace` fallback from canonical `window.placeOrder`.
- Removed runtime fallback from `57-s2-checkout-e2e.js`; it now delegates only to the handler captured from `13-payments.js`.
- Canonical order path remains `velora_create_order_with_commercials`.
- Server shipping is recomputed and compared with client quote.
- Operational payment method selection remains server governed.

## Routine → Cart hardening

- `velora_upsert_cart_item` and `velora_upsert_cart_item_variant` increment existing quantities.
- The routine adapter now reads the authenticated server cart before adding.
- Existing routine lines are not silently duplicated.
- Local legacy cart state is synchronized to the server quantity.
- New commit: `1d973ee0a574cbdf42395d7586aada4385dea8e9`.

## Return resolver hardening

- Found superseded overload:
  `velora_resolve_return(uuid,text,text)`.
- This overload was executable by authenticated users and had weaker transition controls.
- Execute was revoked from PUBLIC, anon, and authenticated.
- Canonical six-argument resolver remains executable by authenticated users.
- Repo record: `20260925102000_harden_legacy_return_resolver_acl.sql`.

## Payment Edge Function name mismatch

Observed mismatch:
- Frontend called `velora-paymob-checkout`.
- Restore-Test previously exposed only `velora-paymob-checkout-restore-test-a5`.

Remediation:
- Deployed a JWT-protected compatibility alias named `velora-paymob-checkout` in Restore-Test using the verified restore-test implementation.
- Function state: ACTIVE.
- `verify_jwt=true`.
- This avoids hard-coding a restore-test-only name into production-targeted frontend code.

## Restore-Test data cleanliness

Current counts:
- seller_subscriptions: 0
- payouts: 0
- promotion_redemptions: 0
- gift_cards: 0
- gift_card_transactions: 0
- legal_documents: 0
- legal_acceptances: 0
- store_shipping_rates: 0
- shipping_quotes: 0
- returns: 0
- return_items: 0
- disputes: 0
- privacy_requests: 0
- invoices: 0
- seller_onboarding_cases: 1

## Security / launch gates still open

- Browser E2E is not verified in this execution environment.
- Paymob live/test settlement and webhook end-to-end browser proof remain external/provider gates.
- Legal documents are still unpublished; checkout remains intentionally fail-closed.
- Tax/accounting operating model remains a launch gate.
- Supabase Auth leaked-password protection remains disabled and requires manual Auth configuration.
- Security Advisor still reports intentional/public SECURITY DEFINER surfaces plus historical policy/index hygiene; no mass-refactor is authorized without workload evidence.

## Classification

### OBSERVED FACT
The current source and Restore-Test backend expose the canonical checkout, governed trust operations, and the new payment compatibility alias described above.

### INFERRED
With the legacy fallback removed and the Paymob alias present, the known source-level checkout routing mismatch should no longer block the card payment function lookup in Restore-Test.

### HYPOTHESIS
The remaining practical checkout blockers, if any, are more likely to surface during authenticated browser execution (session, legal-document gate, shipping configuration, cart state, or provider response) rather than from the previously identified legacy routing paths.

## Explicit non-claims

This checkpoint does not claim:
- Browser E2E PASS.
- Live payment settlement PASS.
- Legal compliance certification.
- Tax compliance certification.
- Production deployment or production mutation.
