# Velora — Phase D3 Legal / Trust Framework Planning
## Beta Trust and Policy Framework — 2026-09-21

**Status:** **PLANNING ONLY**  
**Phase:** Phase D — Operations / Trust / Economics  
**Production:** **FROZEN**  
**Legal text:** **REQUIRES LOCAL LEGAL REVIEW BEFORE BETA**

## 1. Objective

Define the policy and trust document set needed for a Beauty-first marketplace beta without turning Phase D into legal implementation or embedding legal policy inside the Routine engine.

## 2. Required Document Set

The Beta framework should contain:

1. Terms of Service
2. Privacy Policy
3. Refund / Return Policy
4. Seller Agreement
5. Recommendation Disclaimer
6. Authenticity Policy

Each document should have:

- an owner;
- a version;
- an effective date;
- an approval status;
- a change history.

Engineering should be able to display and version the final approved text, but legal counsel owns the legal meaning of the text.

## 3. Consumer Protection Baseline

The Egyptian Consumer Protection Agency currently describes a general exchange/return window of **14 days from receipt without giving a reason, subject to exceptions**, and a **30-day** period for defective goods. Its current guidance also states that, in the defective-goods case described there, the refund is returned using the same method of payment.

Source:
https://cpa.gov.eg/ar-eg/تعريفات
https://cpa.gov.eg/ar-eg/بيانات-اعلامية/ArtMID/654/ArticleID/6790

This is a planning baseline, not a substitute for legal review of Velora's actual product mix, seller structure, contracts, and fulfillment flow.

## 4. Terms of Service

The Terms should define, in legally reviewed form:

- Velora marketplace role;
- customer account responsibilities;
- seller responsibilities;
- product information boundaries;
- payment and order formation;
- returns/refunds;
- prohibited conduct;
- suspension / termination;
- dispute and complaint channels;
- governing-law / jurisdiction provisions as legally appropriate.

No legal clause should be hard-coded into the Routine ruleset.

## 5. Privacy Policy

The Privacy Policy should clearly describe, subject to applicable law:

- what customer data is collected;
- why it is collected;
- which data is needed for Beauty Passport;
- which data is shared with sellers / carriers / service providers;
- retention and deletion handling;
- customer rights and request channels;
- security practices;
- policy version / effective date.

Engineering should preserve data-minimization and access-control boundaries regardless of the final legal wording.

## 6. Recommendation Disclaimer

Beauty Passport is a shopping and routine-discovery experience.

The final disclaimer should make clear that:

- recommendations are product-selection guidance;
- they are not medical diagnosis;
- they are not treatment instructions;
- customers should use product labels and professional advice where appropriate;
- Velora does not invent product facts or health claims.

The disclaimer must remain separate from the deterministic Rules Engine.

## 7. Authenticity Policy

Authenticity is separate from seller identity verification.

The policy should define:

- seller responsibility for product authenticity;
- required evidence categories;
- record retention expectations;
- audit / investigation rights as legally reviewed;
- treatment of authenticity complaints;
- temporary product suspension;
- seller remediation;
- customer resolution path.

Potential evidence fields are operational concepts only:

- supplier source;
- authorization evidence;
- batch / lot number;
- expiry date where applicable;
- authenticity evidence reference.

## 8. Refund / Return Policy

The policy must be explicit about:

- eligibility;
- exceptions;
- damaged/defective goods;
- unopened/sealed requirements where legally appropriate;
- return pickup process;
- refund timing;
- refund method;
- shipping-cost treatment;
- split-shipment handling;
- seller vs Velora operational responsibility.

**Refund economics remain an Owner decision.**

Engineering must not encode a shipping subsidy, seller chargeback, or commission treatment as a hidden rule before that decision is approved.

## 9. Seller Agreement

The Seller Agreement should cover, subject to legal review:

- seller identity and onboarding;
- product data accuracy;
- authenticity responsibility;
- inventory accuracy;
- order handling SLA;
- return/refund obligations;
- complaints;
- prohibited products;
- audit/evidence obligations;
- platform fees and settlement terms;
- suspension / remediation;
- termination.

Commission and commercial terms must be Owner/Product decisions.

## 10. Trust UX Surfaces

Before Beta, trust information should be visible where the customer makes the relevant decision:

- seller identity / verification signal;
- authenticity policy access;
- recommendation disclaimer;
- return/refund policy access;
- order tracking;
- complaint/support path.

Trust should be observable, not hidden in back-office policy documents only.

## 11. Complaint Handling

The beta operating process should support:

`Complaint → Evidence Capture → Seller / Operations Review → Resolution → Escalation`

The Egyptian Consumer Protection Agency also publishes customer complaint channels; its current site lists a hotline and electronic / WhatsApp routes.

Source:
https://cpa.gov.eg/ar-eg/الشكاوى
https://cpa.gov.eg/ar-eg/كيف-تتقدم-بشكوى

Velora's internal support workflow remains a product/operations design item, separate from statutory complaint mechanisms.

## 12. Legal Review Gate

Before Beta launch:

- all six documents have final draft status;
- local counsel has reviewed applicable obligations;
- final effective versions are approved;
- Seller Agreement is accepted by each Beta seller;
- refund economics are aligned with Owner decisions;
- trust surfaces point to the approved versions.

## 13. Engineering Boundary

Engineering may later implement:

- policy version storage;
- effective dates;
- customer-visible policy pages;
- seller acceptance tracking;
- trust metadata display;
- audit references.

Engineering should not:

- author legal clauses;
- decide statutory obligations;
- choose liability allocation;
- choose refund economics;
- encode commercial policy inside the Routine engine.

## 14. Non-goals

- no production legal configuration;
- no automated legal-compliance decision engine;
- no AI explanation layer;
- no dermatologist dependency;
- no commercial pricing implementation;
- no fulfillment-provider selection.

**D3 = PLANNING READY FOR OWNER / LEGAL REVIEW**
