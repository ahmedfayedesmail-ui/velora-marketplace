# Velora — Launch Gate Evidence Snapshot
Date: 2026-09-25
Environment: Restore-Test / staging only
Production: FROZEN

## Observed Facts

### Checkout
- `src/scripts/13-payments.js` now removes the legacy `oldPlace` fallback.
- Missing payment selection now fails closed with `PAYMENT_METHOD_REQUIRED`.
- Operational payment-method decoration defaults to the first operational method when no selection exists.
- Source compile verification: PASS.
- `src/scripts/57-s2-checkout-e2e.js` remains a delegation-only compatibility adapter and source compile verification is PASS.
- `src/scripts/00-localization.js` still contains the historical legacy `placeOrder` implementation, but the active canonical checkout wrapper no longer falls back to it.

### Routine -> Cart
- `src/scripts/62-s1-c-routine-cart.js` now reads the authenticated server cart before routine add-all.
- Existing routine lines are not duplicated; their server quantity is reflected into the legacy/local UI cart.
- New lines are added through the canonical cart RPCs.
- Source compile verification: PASS.

### Return resolver authorization
- Two `velora_resolve_return` overloads existed.
- Superseded 3-argument overload:
  - anon execute: false
  - authenticated execute: false
- Canonical 6-argument overload:
  - anon execute: false
  - authenticated execute: true
- The legacy ACL hardening was applied to Restore-Test and recorded in:
  `supabase/migrations/20260925102000_harden_legacy_return_resolver_acl.sql`.

### Sensitive frontend writes
A source scan of the available frontend files found only read access to:
- `returns`
- `return_items`
- `privacy_requests`
- `disputes`
- `seller_onboarding_cases`
- `gift_cards`
- `gift_card_transactions`
- `invoices`

No direct browser-side insert/update/delete/upsert was found for these surfaces in the scanned files.

### Trust UI rendering
- Seller onboarding UI escapes DB-backed values before inserting them into HTML.
- Trust & Compliance UI escapes DB-backed values before HTML rendering.
- Sensitive mutations remain RPC calls.

### Server-side role simulation
Using an authenticated-role simulation inside a transaction:
- Seller onboarding self-read returned `ok=true` and `beta_ready=false` for the existing test seller.
- Legacy return resolver execute privilege = false.
- Canonical return resolver execute privilege = true.
- Test transaction was rolled back; no persistent test data was created.

### Data cleanliness after rollback
Current Restore-Test counts remain:
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

### Deployment
Latest Preview for the current branch is READY:
- commit: `dfd644c8af7ec3e7d7a1a2953c30ef50420709c6`
- deployment: `dpl_BguB1YDCskBsozdiCKPumR1y5mBH`
- preview: `velora-marketplace-d4y1k9kbw-ahmedconccc-7063.vercel.app`
- build logs: build completed successfully.

The deployed Preview directly serves the updated `13-payments.js`, `62-s1-c-routine-cart.js`, and `57-s2-checkout-e2e.js`.

## Inferred

- The canonical checkout path no longer has a code-level fallback to the legacy order-creation implementation.
- Routine add-all now has a consistent source-level contract between the canonical Supabase cart and the legacy visible cart.
- The superseded return resolver is no longer callable by the authenticated client role.

## Hypotheses / Not Yet Verified

- Full browser E2E is not verified in this environment because the browser automation executable/tool is unavailable.
- Customer journey still requires actual browser evidence:
  login -> Beauty Passport -> routine -> Order the whole routine -> cart -> checkout -> order.
- EN/AR, mobile 393x852, desktop, dark mode, admin/seller browser journeys, console/network residuals remain browser gates.
- Paymob live/test settlement behavior and production webhook behavior remain provider gates.
- Legal publication, accounting/tax treatment, privacy data-map/retention/transfers, and Auth leaked-password protection remain external/manual launch gates.

## Security Advisor Context

Current Supabase security advisor findings still include:
- leaked password protection disabled
- pg_net in public schema (non-relocatable in current environment)
- 6 RLS-enabled tables without policies
- many SECURITY DEFINER functions callable by authenticated users
- multiple permissive RLS policies

These are not treated as equivalent vulnerabilities. Function exposure is reviewed by authorization intent; performance-policy overlap is treated as hygiene unless workload evidence shows impact.

## Verification Rule

No statement above should be converted to PASS for browser/provider/legal launch gates without corresponding evidence.
