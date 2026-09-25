# Velora — Master Handoff Final State
## 2026-09-25

Environment: Restore-Test / staging  
Branch: `sprint-2-s2d-admin`  
Production: **FROZEN**

## Engineering closures completed in this continuation

### Beauty Passport
- Egypt-local season source is server-authoritative: `Africa/Cairo`.
- Explicit 12-month season mapping.
- Current date `2026-09-25` resolves to Autumn.
- Routine fingerprint/context version uses `beauty-context.v2`.
- Routine UX polls the server context while open and regenerates when the server date changes.
- Browser clock is never authoritative.
- Seasonal product fit remains explicit catalog data.
- Sensitive skin is aligned between the Quiz v2 UI/backend contract.
- Live weather is intentionally not claimed or required.

### Checkout / payments
- Legacy checkout submit interceptor `57-s2-checkout-e2e.js` now delegates to canonical `13-payments.js`.
- Duplicate `currency` declaration in `startPayment()` fixed.
- Server rechecks checkout currency/operational tender.
- Operational checkout currency for Egypt is EGP.
- Operational payment methods currently expose:
  - Card / Paymob test route.
  - Cash on Delivery / manual tender.
- Payment method is bound to the canonical order before provider flow.
- Checkout reference is unique per customer.
- Idempotent replay returns the existing order before commercial re-application.
- Shipping is recomputed server-side and client/server mismatch fails closed.
- Canonical cart cleanup is attempted after successful order/payment flow.

### Seller operations
- Seller onboarding evidence/control plane created.
- Beta-ready gate requires application, identity, catalog, SLA, pilot, authenticity clearance and operational contact evidence.
- Direct client writes are not the intended mutation path.
- Owner-only gift-card issuance.

### Trust / legal engineering
- Returns direct CRUD removed.
- Return requests require delivered order and delivered shipment item.
- Refund transition requires evidence reference.
- Disputes use governed open/resolve flow.
- Privacy requests and consents use governed RPCs and idempotent request state.
- Invoices are read-only to clients; staff prepares controlled manual invoices.
- No generic tax rate is inferred.
- Legal documents are versioned/hashed/publish-controlled.
- Checkout/subscription fail-closed when required legal docs are unpublished.

### Legacy/security
- Legacy recommendation tables direct CRUD removed.
- Variant cart removal is authenticated-only.
- Financial commission/FX RPCs are no longer anonymous.
- Sensitive control-plane RPCs have explicit `anon=false` and `authenticated=true`.

## Verification completed

- 12-month season matrix: PASS.
- Egypt-local current context: PASS.
- Direct ACL verification for critical control RPCs: PASS.
- Operational EG/EGP methods: Card + COD returned.
- Operational checkout currency: EGP returned.
- JavaScript compile-only check: 7/7 PASS.
- Latest Vercel branch deployment: READY.
- Latest Vercel build errors-only log: Build Completed.

## Not claimed

- Full browser E2E for new flows.
- Live Paymob settlement.
- Automatic live subscription renewal.
- Bank payout automation.
- Real external carrier integration.
- Tax/e-invoice/e-receipt compliance.
- Final legal compliance.
- Live weather personalization.
- Medical effectiveness of Beauty Passport routines.

## Remaining launch gates

### Browser
- Customer journey from login → Beauty Passport → routine → cart → checkout → order.
- Seller/admin surfaces.
- Returns/disputes customer UX.
- Mobile/desktop/dark mode.
- Arabic/English.
- Network + console residuals.

### Provider
- Paymob live credentials, settlement, refund, chargeback and reconciliation evidence.
- Carrier/provider selection and actual integration.
- Payout/bank settlement rail.
- Renewal scheduler + billing instrument/tokenization for live recurring billing.

### Egyptian legal / accounting
- Final Arabic/English legal texts reviewed by Egyptian counsel.
- Real operating entity information.
- Marketplace/seller role allocation and contract language.
- Statutory returns/refunds exceptions and operational deadlines.
- Privacy data-map, legal roles, retention, transfers and request handling.
- Tax registration and invoicing/e-receipt operating model.
- Final Beauty Advisor/AI disclaimer and product-safety wording.

### Security infrastructure
- Supabase leaked-password protection is still disabled and requires Auth configuration.
- `pg_net` is installed in `public` and is non-relocatable; moving it is not a safe option.
- Security Advisor still reports expected public read functions and historical RLS/policy hygiene findings.
- Performance Advisor reports broad pre-existing unindexed FKs and overlapping permissive policies; do not mass-refactor before launch without workload evidence.

## Production rule

No production mutation was authorized in this continuation. Restore-Test/staging only.
