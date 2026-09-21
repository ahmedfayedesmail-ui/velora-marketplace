# Velora — Phase D1 Seller Operations Planning
## Curated Seller Operating Model — 2026-09-21

**Status:** **PLANNING ONLY**  
**Phase:** Phase D — Operations / Trust / Economics  
**Production:** **FROZEN**  
**Implementation:** **NOT AUTHORIZED / NOT REQUIRED FOR THIS DOCUMENT**

## 1. Decision

Phase D is a separate operational phase running in parallel with Phase C.

MVP fulfillment model is:

**Curated Sellers**

Target operating shape:

**5–10 curated sellers** for the initial Beauty beta.

The seller model is intentionally controlled. "Curated" means sellers enter through a reviewed onboarding path and operate under a common operating standard; it does not mean a fully unmanaged open marketplace.

## 2. Operating Boundary

D1 defines the operating model only.

It does not:

- add seller features to the Routine engine;
- encode commission or subscription pricing into product/routine logic;
- change the order state machine;
- select a shipping carrier;
- make legal determinations;
- change Production.

Commercial decisions remain Owner/Product decisions.

## 3. Seller Lifecycle

Proposed operational lifecycle:

`Application → KYC Review → Authenticity Review → Catalog Review → SLA Acceptance → Pilot → Active`

A seller should not be considered operationally ready until the required evidence is complete and the operating terms are accepted.

## 4. KYC vs Authenticity

These are separate controls.

### KYC / Seller Identity

Question answered:

**Who is the seller?**

Planning evidence may include the legal/business identity information required by the final onboarding policy.

### Authenticity / Product Trust

Question answered:

**Are the products being offered supported by sufficient authenticity evidence?**

Planning evidence may include:

- source / supplier evidence;
- brand authorization evidence where relevant;
- batch / lot evidence where applicable;
- expiry evidence where applicable;
- product provenance records;
- exception / investigation history.

A seller can pass identity verification while a specific product still fails authenticity review.

## 5. Curated Seller Standard

Every curated seller should have an agreed operating profile covering:

- approved seller identity;
- approved Beauty categories;
- catalog quality standard;
- authenticity standard;
- inventory accuracy expectation;
- order acceptance / dispatch SLA;
- return handling SLA;
- customer-support response expectation;
- escalation contact;
- suspension / remediation process.

Exact commercial terms are Owner decisions and must remain outside the Routine engine.

## 6. Catalog Gate

A seller-approved account does not automatically make every product eligible for Routine Discovery.

Routine eligibility remains catalog-driven.

Therefore D1 must establish a seller-side review process for:

- product completeness;
- Beauty category resolution;
- ingredient / benefit metadata quality;
- stock accuracy;
- price and currency correctness;
- authenticity evidence;
- policy exclusions.

The Routine engine consumes approved catalog state; it does not perform seller governance.

## 7. Minimum Beta Operating Evidence

Before seller activation for Beta:

- curated seller list is approved;
- seller identity review is complete;
- authenticity process is defined and repeatable;
- operating SLA is accepted;
- support/escalation contact is known;
- return workflow is documented;
- evidence can be retrieved for disputes or audits.

## 8. Operational Metrics

Track these as operating signals, not as hidden product-ranking logic:

- order acceptance rate;
- dispatch within SLA;
- seller cancellation rate;
- stock mismatch rate;
- return rate;
- authenticity exception rate;
- product defect rate;
- response time to operations escalations.

The initial thresholds should be defined by Operations/Owner before Beta and must not be silently invented by engineering.

## 9. Escalation

Proposed escalation chain:

`Seller → Velora Operations → Owner / Decision Maker`

Escalations should cover:

- repeated SLA misses;
- stock inaccuracies;
- authenticity concerns;
- customer complaints;
- return disputes;
- policy violations.

Engineering may provide evidence surfaces, but should not invent commercial sanctions.

## 10. Owner Decisions

The following remain Owner/Product decisions:

1. Commission percentage.
2. Subscription pricing.
3. Seller commercial terms.
4. Refund economics.
5. Final seller onboarding requirements where commercial/legal exposure exists.

Fulfillment Model A is already confirmed.

## 11. Engineering Boundary

Engineering work, when later authorized, should support the operating model through data and workflow primitives only.

Potential later engineering artifacts:

- seller verification state;
- authenticity evidence references;
- SLA configuration;
- operational status;
- audit history.

Those are planning concepts only in D1. No schema or UI change is authorized by this document.

## 12. Exit Gate

D1 planning is ready to move toward Beta implementation when Owner/Operations can answer:

- Who are the initial curated sellers?
- Which evidence is required for identity?
- Which evidence is required for authenticity?
- What SLA is accepted?
- Who owns seller escalation?
- What happens when a seller repeatedly fails the operating standard?

## 13. Non-goals

- no open seller marketplace expansion;
- no warehouse / fulfillment-center launch;
- no second shipping provider decision;
- no commission encoding;
- no subscription implementation;
- no Routine-engine changes.

**D1 = PLANNING READY FOR OWNER/OPERATIONS REVIEW**
