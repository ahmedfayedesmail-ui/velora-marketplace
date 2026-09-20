# Velora — Architecture Document Phase 2
## Beauty Commerce Architecture Reference

**Date:** 2026-09-20  
**Branch:** `sprint-2-s2d-admin`  
**Phase 1 launch market:** Egypt  
**Phase 1 languages:** Arabic + English  
**Phase 1 canonical currency:** EGP  
**Reference use:** Sprint 1 Beauty MVP

---

## 1. Purpose

Phase 2 defines the product architecture for turning Velora from a generic multi-vendor marketplace into a **beauty-first, personalization-led commerce platform**.

The architecture is intentionally separated into:
- product/business principles supplied by the Owner,
- engineering implementation choices,
- future capabilities that must not create unnecessary Phase 1 complexity.

The document is a product/engineering reference, not a Production authorization.

---

## 2. Beauty Passport

### Concept

The **Beauty Passport** is the user's persistent beauty profile.

It should answer three practical questions:

1. What does this user want to achieve?
2. What product characteristics fit the user's stated preferences?
3. What has the user already tried, liked, disliked, or rejected?

### Phase 1 data model

The MVP Passport should store only information required for personalization and feedback:

- quiz responses
- stated beauty goals
- product/category preferences
- texture preferences
- effect/experience feedback
- saved recommendations
- recommendation interaction history

The MVP should avoid collecting unnecessary sensitive or health-related data.

### Identity

The Passport is tied to the authenticated Velora account.

The account is the authoritative owner of:
- profile
- quiz state
- recommendation history
- feedback history

Guest users may preview the quiz, but persistence of the Passport belongs to the authenticated account.

### Future extension

The model can later support:
- routine history
- product compatibility history
- recurring purchase patterns
- personalized reminders
- routine bundles
- seller-independent beauty journeys

---

## 3. Personal Beauty OS Vision

Velora's longer-term direction is a **Personal Beauty OS** rather than a simple catalog.

The system should progressively become the layer that connects:

`Goal → Profile → Recommendation → Purchase → Experience → Feedback → Better Recommendation`

The core principle is learning from explicit user feedback instead of relying only on generic popularity.

### Architecture principle

Keep the Recommendation Engine modular.

Phase 1 uses deterministic/rules-based recommendations. The architecture must allow a later recommendation service to replace or augment the rules engine without changing the Passport contract.

---

## 4. Frictionless Shopping

The commerce experience should minimize steps between intention and purchase.

Target flow:

`Discover → Understand → Add → Checkout`

For recommendation bundles:

`Quiz → 5 Recommendations → Add All → Checkout`

### Product requirements

- recommendation explanations are visible before purchase
- product cards remain actionable
- adding recommended products should require minimal clicks
- cart state remains authoritative and persistent
- checkout must never claim an actually populated cart is empty
- currency shown to the user must match the current market contract

---

## 5. Revenue Model

Velora keeps the marketplace revenue model:

### Commission

Velora earns a platform commission on eligible marketplace transactions.

The technical order model should keep financial concepts separate:

- gross merchandise value
- platform commission
- seller net value
- payment status
- payout status

The UI should not silently mix gross and net values.

### Subscriptions

Subscriptions are a future recurring-revenue layer for eligible sellers and/or platform capabilities.

Examples of future subscription value:
- enhanced storefront capabilities
- merchandising tools
- advanced analytics
- premium placement
- seller operational tools

Subscription pricing, packaging, and commercial terms remain Owner/Product decisions.

### Advertising

Advertising can become a second marketplace revenue stream:
- sponsored placement
- seller campaigns
- category promotion
- contextual beauty discovery placements

Ad ranking and disclosure must remain explicit.

---

## 6. Vertical Adjacency Model

The initial vertical is **Beauty**.

The architecture should support adjacent categories without rebuilding the marketplace core.

Examples of adjacent verticals:
- hair care
- personal care
- wellness-adjacent beauty products
- tools/accessories
- fragrance

### Rule

The recommendation/profile model should be designed around **attributes, goals, preferences, and feedback**, not hardcoded to a single product taxonomy.

That allows the marketplace engine to remain reusable while Beauty remains the first specialized experience.

---

## 7. Currency-Aware Architecture

### Phase 1

Egypt is the launch market.

The canonical customer-facing currency is:

**EGP**

### Engineering principle

Currency is a first-class commerce attribute.

The system should retain:
- currency code
- monetary amount
- market/context

The UI must not infer a product's currency from arbitrary browser locale alone.

### Future

The architecture may later support multiple market currencies and conversion policies.

However:

**Multi-currency capability is an extension, not a Phase 1 requirement.**

No Phase 1 flow should silently convert or substitute USD for an EGP canonical fixture.

---

## 8. Egypt-Only Phase 1

Phase 1 is intentionally constrained to Egypt.

Implications:
- shipping assumptions are Egypt-first
- currency is EGP
- customer-facing language is AR + EN
- market rules are Egypt-first
- tax/payment/shipping integrations can be localized to the launch market

This is a scope boundary, not a permanent platform limitation.

---

## 9. Language Strategy

### Phase 1 UI

Only two languages are exposed:

- Arabic (AR)
- English (EN)

The codebase retains the existing localization infrastructure for future languages, but additional languages are hidden from the Phase 1 selector.

### Principle

Language and market are separate concepts.

A language selection must not automatically force:
- currency
- country
- payment method
- shipping behavior

---

## 10. Data Flow

The intended Beauty personalization flow is:

`Authentication`
→ `Beauty Passport`
→ `Beauty Quiz`
→ `Rules Engine`
→ `5 Recommendations`
→ `Explanation Layer`
→ `Cart`
→ `Checkout`
→ `Feedback`
→ `Passport update`

### Source-of-truth rules

- Authentication: Supabase Auth/session
- Commerce data: Supabase canonical records
- Cart: authoritative persisted cart + synchronized client state
- Passport: authenticated user profile data
- Recommendations: deterministic rules in Phase 1
- Feedback: authenticated persisted records

---

## 11. Engineering Boundaries

### Engineer decisions

The Engineer owns:
- table/API boundaries
- component structure
- query strategy
- rules-engine implementation
- client state synchronization
- validation
- error handling
- performance
- responsive implementation
- test structure

### Owner/Product decisions

The Owner/Product role owns:
- commercial terms
- subscription packaging/pricing
- commission policy
- advertising policy
- Beauty Passport product scope beyond the MVP
- future vertical expansion priorities
- launch-market decisions

The engineering implementation should not invent commercial policy.

---

## 12. Phase 1 Non-Goals

To keep the MVP small, Phase 1 does not require:

- machine-learning recommendations
- automatic diagnosis
- medical/clinical claims
- multi-country operations
- multi-market pricing strategy
- a complex loyalty economy
- advanced advertising auctions
- large seller subscription packages

These can be added later without changing the Phase 1 core contract.

---

## 13. Reference for Sprint 1 Beauty MVP

This document is the architecture reference for:

`SPRINT_1_BEAUTY_MVP_PLAN.md`

Any Sprint 1 implementation should preserve:
- Egypt-first scope
- AR + EN
- EGP-first commerce
- authenticated Beauty Passport
- rules-based recommendations
- explanation-first recommendations
- explicit feedback loop
- mobile-first UI
- reusable marketplace primitives

---

## 14. Owner Decision Register

At the current planning point, the following business/product decisions are already defined:

| Topic | Phase 1 decision |
|---|---|
| Launch market | Egypt only |
| Primary vertical | Beauty |
| Languages exposed | Arabic + English |
| Canonical currency | EGP |
| Recommendation method | Rules-based |
| Revenue model | Commission + future subscriptions/ads |
| Passport concept | Persistent beauty profile |
| Long-term vision | Personal Beauty OS |

No additional Owner input is required to start Sprint 1 implementation within these boundaries.

