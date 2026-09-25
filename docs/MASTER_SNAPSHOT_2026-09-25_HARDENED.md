# Velora — Hardened Master Snapshot
## 2026-09-25

Repository: `ahmedfayedesmail-ui/velora-marketplace`  
Branch: `sprint-2-s2d-admin`  
Environment: Restore-Test / staging  
Production: **FROZEN**

## Beauty Passport

Implemented and verified at the backend/source level:
- Egypt-local timezone: `Africa/Cairo`
- deterministic 12-month season mapping
- server-authoritative season/date
- automatic routine rollover when the server-reported local date changes
- explicit catalog seasonal-fit ranking input
- sensitive-skin option aligned in Quiz v2 UI and Passport summary
- customer-facing disclosure that live weather is not currently used

Browser verification is still a separate gate.

## Commercial / Checkout

Implemented:
- server-authoritative shipping quote
- shipping mismatch fail-closed
- shipping configuration fail-closed
- customer checkout-reference unique index
- idempotent replay returns existing order before re-applying coupon/promotion/gift-card
- authenticated-only sensitive checkout RPCs

## Seller Operations

Implemented:
- seller onboarding-case control plane
- evidence references and reviewer lifecycle
- operational Beta Ready derived gate
- operational contact required for Beta Ready
- Seller Onboarding Admin surface
- existing seller backfilled into a non-ready case

Legal acceptance remains a separate versioned gate.

## Trust / Compliance

Implemented:
- Returns / Return Items direct client CRUD removed
- governed return resolution with refund evidence requirement
- shipment source-of-truth hardening
- privacy consent/request RPC-only mutation
- privacy request idempotency
- privacy request state machine
- disputes RPC-only mutation
- dispute idempotency/state-machine/resolution requirements
- invoice direct writes removed
- staff-only manual invoice preparation with total reconciliation
- no hard-coded tax rate
- Trust & Compliance Admin control plane
- Gift Card issuance restricted to Owner

## Legacy / Security

Implemented:
- legacy recommendation table direct CRUD removed
- variant cart remove RPC anon execute removed
- sensitive control-plane writes remain RPC/audit governed

## Current blocked gates

### Browser
Required before closing:
- unified customer journey
- Beauty Passport / Quiz / Routine
- Checkout / shipping / payment
- seller/admin
- mobile / desktop / dark mode
- EN / AR
- console/network residual verification

### Provider
Required:
- Paymob credential/settlement verification
- real carrier selection/integration
- bank/payout settlement adapter
- production scheduler/billing instrument for renewals

### Legal / Accounting
Required:
- final Arabic/English legal documents reviewed by Egyptian counsel
- operating-entity identifiers
- seller agreement and commercial terms
- returns/refund policy and statutory exception handling
- privacy role/data map/retention/transfer review
- tax registration and invoice/e-receipt operating model
- final Beauty Advisor wording

### Owner / Product
Required:
- commission and seller commercial terms
- subscription pricing
- advertising policy
- refund economics
- shipping cost allocation

## Do not claim

Do not claim:
- live weather personalization
- live Paymob settlement
- automatic live subscription renewal
- bank payout automation
- tax/e-invoice compliance
- final legal compliance
- Browser PASS for newly added trust surfaces

All Restore-Test changes remain non-production.
