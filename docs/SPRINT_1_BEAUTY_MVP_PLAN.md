# Velora — Sprint 1 Beauty MVP Plan
## Beauty Personalization MVP

**Date:** 2026-09-20  
**Reference architecture:** `docs/ARCHITECTURE_DOC_PHASE_2.md`  
**Launch market:** Egypt  
**Languages:** AR + EN  
**Canonical currency:** EGP  
**Delivery priority:** Mobile-first

---

## 1. Objective

Build the smallest complete Beauty personalization loop that takes a user from a short quiz to explainable product recommendations, lets the user add the recommendations to Cart with minimal friction, and records explicit feedback back into the user's Beauty Passport.

Target experience:

`Quiz → Recommendations → Add All → Checkout → Feedback → Better Profile`

---

## 2. Component 1 — Beauty Quiz

### Goal

Capture enough explicit information to produce useful deterministic recommendations without creating a long onboarding form.

### Target

**5–7 questions**  
**Completion time: ≤ 2 minutes**

### Question categories

Recommended question groups:
1. Primary beauty goal
2. Main concern
3. Product preference
4. Texture preference
5. Routine/style preference
6. Optional sensitivity/avoidance preference
7. Optional shopping priority

The exact wording can be refined during implementation without changing the data contract.

### Acceptance criteria

- quiz loads on mobile
- progress is visible
- user can move forward/back
- required answers are validated
- completion takes no more than the target interaction budget
- answers are persisted for authenticated users

---

## 3. Component 2 — Beauty Passport Page

### Goal

Give the user a readable profile of what Velora currently knows about their beauty preferences.

### Sections

- Beauty goals
- Main concerns
- Preferences
- Recent feedback
- Current recommendations
- Edit / retake quiz

### Acceptance criteria

- authenticated user can open Passport
- latest quiz responses are visible
- profile data persists after refresh
- user can retake the quiz
- updates do not delete unrelated account/commerce data

---

## 4. Component 3 — Rules-Based Recommendation Engine

### Phase 1 rule

No machine learning is required.

The engine receives:

`Passport + Product Attributes`

and returns ranked candidate products.

### Inputs

- beauty goal
- concern
- texture preference
- effect preference
- avoidance preference
- product category
- product availability
- product status

### Output

A ranked list of:

**5 recommendations**

Each recommendation should include a structured reason code.

Example:

`goal_match`  
`texture_match`  
`concern_match`  
`preference_match`

### Engineering rule

The scoring system must be deterministic and inspectable.

Given the same Passport and same product catalog state, the engine should produce the same ordering unless a defined rule/input changes.

---

## 5. Component 4 — Recommendation Explanations

Every recommendation must answer:

**“Why is this product recommended to me?”**

### Example explanation structure

- matches stated goal
- matches preferred texture
- addresses selected concern
- fits stated preference

### Acceptance criteria

- all 5 recommendations have an explanation
- explanations are based on actual stored inputs
- no medical/diagnostic claims are generated
- explanation remains understandable on mobile

---

## 6. Component 5 — Feedback Loop

### Goal

Capture explicit experience feedback after product interaction/purchase.

### Required feedback dimensions

- rating
- texture
- effect

Optional later dimensions:
- scent
- packaging
- repurchase intent
- free-text note

### Data flow

`Product Interaction`
→ `Feedback`
→ `Persist`
→ `Passport / Recommendation signals`

### Acceptance criteria

- user can submit feedback
- feedback is associated with the authenticated account
- feedback is associated with the correct product
- rating/texture/effect are persisted
- duplicate accidental submissions are handled safely

---

## 7. Component 6 — Beauty-Ready Variants

Variants must be compatible with the Beauty recommendation and Cart model from the beginning.

Potential beauty variant dimensions:
- size
- shade
- finish
- format

### Acceptance criteria

- recommendation can reference a variant where applicable
- Cart preserves product + variant identity
- variant quantity is handled correctly
- future variant-aware recommendation rules remain possible

---

## 8. Component 7 — Mobile-First UI

### Principle

Design for the smallest supported mobile viewport first, then expand to desktop.

### Requirements

- no unintended horizontal scrolling
- quiz controls remain reachable
- recommendation cards fit mobile width
- add-all action is obvious
- Passport content remains readable
- feedback controls are touch-friendly
- checkout remains reachable without layout clipping

---

## 9. End-to-End Acceptance Criteria

The MVP is functionally complete when all of the following are true:

### Quiz

- user completes quiz in **≤ 2 minutes**

### Recommendations

- user receives **5 recommendations**
- each recommendation has an explanation

### Add All

- user can add all five recommendations to Cart in **3 clicks or fewer** after recommendations are visible

### Feedback

- rating is recorded
- texture is recorded
- effect is recorded

### Passport

- quiz answers are stored in the user's profile
- feedback is linked to the user
- profile data survives refresh/login

### Commerce

- recommended products use canonical catalog/product records
- Cart retains product/variant identity
- checkout remains EGP-first in Phase 1

---

## 10. Suggested Technical Boundaries

### Frontend modules

- `beauty-quiz`
- `beauty-passport`
- `recommendation-engine`
- `recommendation-card`
- `feedback-form`
- `variant-selector`

### Backend contracts

Keep authenticated persistence behind explicit contracts/RPCs where required.

Recommended conceptual operations:
- load Passport
- save Quiz
- calculate/return Recommendations
- save Feedback
- load Feedback history

The exact RPC/table names are an engineering implementation decision.

---

## 11. Data Model — MVP

Minimum conceptual entities:

### Beauty Passport

`user_id`  
`quiz_version`  
`goal`  
`concern`  
`texture_preference`  
`effect_preference`  
`avoidance_preferences`  
`updated_at`

### Recommendation Event

`user_id`  
`product_id`  
`variant_id`  
`reason_codes`  
`score`  
`created_at`

### Feedback

`user_id`  
`product_id`  
`variant_id`  
`rating`  
`texture`  
`effect`  
`created_at`

This is a conceptual contract; physical schema normalization is an engineering decision.

---

## 12. Recommendation Scoring — Initial Rules

An intentionally simple scoring model can start with weighted matches:

- primary goal match
- concern match
- texture match
- effect match
- preference match

The engine should expose its reason codes so the explanation layer can show the user why the product appeared.

Do not create opaque scoring that cannot be explained or tested.

---

## 13. Safety / Product Boundaries

The Beauty MVP is a commerce personalization feature.

It should not:
- diagnose skin/medical conditions
- claim to treat disease
- infer sensitive health status
- present recommendation output as medical advice

The system should recommend products based on explicit shopping preferences and product attributes.

---

## 14. Delivery Sequence

### Phase A
Data contract + Passport persistence

### Phase B
Quiz UI

### Phase C
Rules engine

### Phase D
Recommendation UI + explanations

### Phase E
Add-All to Cart

### Phase F
Feedback loop

### Phase G
Variant integration

### Phase H
Mobile polish + regression

### Phase I
End-to-end browser verification

---

## 15. Definition of Done

Sprint 1 Beauty MVP is ready for browser acceptance when:

- all seven components are implemented
- automated/static validation passes
- no known source-level blocker remains
- EGP-first Phase 1 rules are preserved
- AR + EN are the only exposed languages
- mobile-first layout is implemented
- the full acceptance sequence can be executed end-to-end

Final launch validation remains an interactive browser gate.

