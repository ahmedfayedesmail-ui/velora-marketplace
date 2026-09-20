# Velora — Sprint 1 Beauty MVP Detailed Design
## Engineering Design — 2026-09-20

**Branch:** `sprint-2-s2d-admin`  
**Environment:** design/source work only  
**Production:** **FROZEN — no Production changes authorized**  
**Launch market:** Egypt  
**Languages exposed:** EN + AR  
**Canonical currency:** EGP  
**Delivery priority:** mobile-first

---

## 1. Design Decision

Sprint 1 will extend the existing marketplace primitives rather than create a parallel commerce model.

Existing authoritative commerce entities remain the source of truth:

- `profiles`
- `products`
- `product_variants`
- `carts` / `cart_items`
- `orders` / `order_items`
- `reviews`

Beauty personalization adds a small, explicit layer for:

1. Beauty Passport state
2. Quiz persistence
3. Deterministic recommendation runs
4. Recommendation explanations
5. Beauty feedback signals

No AI/ML inference is required.

No medical diagnosis, treatment claim, or health-status inference is part of the MVP.

---

## 2. Existing Schema Constraints

The current Restore-Test schema already provides:

### `profiles`
Identity/profile anchor with:
- `id`
- `full_name`
- `email`
- `country_code`
- `preferred_language`
- `preferred_currency`

### `products`
Canonical catalog source with:
- `id`
- `category` / `subcategory`
- `price`
- `stock`
- `status`
- `ingredients`
- `benefits`
- `skin_types`
- `concerns`
- `tags`
- `currency_code`

### `product_variants`
Variant-aware commerce source with:
- `id`
- `product_id`
- `name`
- `sku`
- `price`
- `stock_quantity`
- `attributes`
- `is_active`

### Checkout identity
`cart_items`, `orders`, and `order_items` already preserve canonical UUID product/variant identity.

**Engineering rule:** recommendations must return canonical UUID product/variant references compatible with this commerce model.

---

## 3. Beauty Passport Data Contract

### 3.1 Minimal table: `beauty_passports`

One active Passport per authenticated customer.

Proposed columns:

| Column | Type | Rule |
|---|---|---|
| `user_id` | uuid | PK/FK to authenticated profile |
| `quiz_version` | text | Explicit schema/version identifier |
| `goal` | text | Required MVP preference |
| `concern` | text | Required MVP preference |
| `texture_preference` | text | Optional |
| `effect_preference` | text | Optional |
| `avoidance_preferences` | jsonb | Product-attribute exclusions only |
| `shopping_priority` | text | Optional |
| `updated_at` | timestamptz | Auto-updated |

### 3.2 Boundary

Passport stores explicit shopping/profile preferences only.

Do not store:
- medical diagnoses
- clinical assessments
- inferred health conditions
- sensitive health classifications

The Passport is owned by the authenticated user.

---

## 4. Quiz Contract

### 4.1 Target

5–7 questions, designed for <= 2 minutes.

### 4.2 Canonical answer fields

The quiz maps into the Passport contract:

1. `goal`
2. `concern`
3. `texture_preference`
4. `effect_preference`
5. `shopping_priority`
6. `avoidance_preferences` (optional)
7. one optional future-safe preference field if needed

Question wording can evolve without changing the persistence contract.

### 4.3 Save behavior

Preferred operation:

`save Beauty Passport`

The authenticated user ID is taken from the session/server context; the client must not be allowed to choose another owner's `user_id`.

Save is an upsert of the current Passport.

---

## 5. Recommendation Engine

### 5.1 Inputs

`Passport + canonical product catalog + active variant availability`

Candidate eligibility:

- product status = approved/published state used by the marketplace
- product has stock or an active in-stock variant
- product is compatible with the current Egypt/EGP Phase-1 commerce scope
- canonical UUID identifiers only

### 5.2 Product signals

Use existing product attributes first:

- category
- subcategory
- skin_types
- concerns
- tags
- benefits
- ingredients
- product variant attributes
- availability
- price/currency context

### 5.3 Initial deterministic scoring

Start with a transparent weighted score.

Example baseline:

| Match | Weight |
|---|---:|
| Goal | 40 |
| Concern | 25 |
| Texture | 15 |
| Effect | 10 |
| Preference / avoidance alignment | 10 |

Total = 100.

Weights are engineering constants for the initial ruleset, not commercial policy.

### 5.4 Reason codes

Every scored result exposes machine-readable reasons, for example:

- `goal_match`
- `concern_match`
- `texture_match`
- `effect_match`
- `preference_match`
- `availability_match`

The explanation layer renders these reason codes into customer-readable copy.

### 5.5 Determinism

Same Passport + same product catalog state + same ruleset version must produce the same ordering.

Any future randomness requires an explicit, versioned product decision.

---

## 6. Recommendation Persistence

### 6.1 Table: `beauty_recommendation_runs`

Suggested columns:

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | Authenticated owner |
| `ruleset_version` | text | Versioned deterministic rules |
| `input_snapshot` | jsonb | Sanitized Passport inputs used for run |
| `created_at` | timestamptz | Run timestamp |

### 6.2 Table: `beauty_recommendation_items`

Suggested columns:

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | PK |
| `run_id` | uuid | FK to run |
| `product_id` | uuid | FK to `products` |
| `product_variant_id` | uuid | Nullable FK to `product_variants` |
| `position` | smallint | 1–5 |
| `score` | numeric | Deterministic score |
| `reason_codes` | text[] | Explanation source |
| `created_at` | timestamptz | Timestamp |

Recommended invariant:

- one run returns up to five visible recommendations
- positions are unique within a run
- each visible recommendation has at least one reason code

The persisted recommendation is an event/history record, not a replacement for the catalog.

---

## 7. Recommendation API Boundary

Keep the frontend contract explicit.

Conceptual operations:

### `get Beauty Passport`
Authenticated read for current user.

### `save Beauty Passport`
Authenticated write for current user.

### `get Beauty Recommendations`
Authenticated request using current Passport and canonical product state.

### `record Recommendation Interaction`
Optional lightweight event for:
- viewed
- added_to_cart
- dismissed

### Existing recommendation functions

Restore-Test currently contains functions named:

- `velora_get_recommendations`
- `velora_get_recommendation_intelligence`
- `velora_get_recommendation_quality`
- `velora_record_recommendation_feedback`

These should **not be silently repurposed** for Sprint 1.

Before implementation, inspect their exact contracts and determine whether any are safe to reuse as adapters. If they belong to an existing intelligence/control-plane feature, preserve that boundary and create Beauty-specific contracts instead.

---

## 8. Explanation Layer

Every displayed recommendation must answer:

**Why was this recommended?**

The explanation is generated from persisted reason codes, not free-form model text.

Example mapping:

- `goal_match` → “Matches your selected goal”
- `texture_match` → “Matches your preferred texture”
- `concern_match` → “Fits your selected concern”

The explanation layer must not introduce claims stronger than the underlying product attributes.

No medical or diagnostic language.

---

## 9. Beauty Feedback

### 9.1 Separate from public review

Do not overload `reviews` for private recommendation-learning signals.

The existing `reviews` table is the public/customer commerce review object and already has order/product/customer relationships.

Beauty Feedback is an experience signal used by personalization.

### 9.2 Table: `beauty_feedback`

Suggested columns:

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | Authenticated owner |
| `product_id` | uuid | FK to `products` |
| `product_variant_id` | uuid | Nullable FK |
| `order_item_id` | uuid | Nullable FK when linked to purchase |
| `rating` | smallint | 1–5 |
| `texture` | text | Controlled enum/list |
| `effect` | text | Controlled enum/list |
| `source` | text | e.g. purchase / product-interaction |
| `idempotency_key` | text | Unique submission key |
| `created_at` | timestamptz | Timestamp |

### 9.3 Duplicate protection

The client generates a stable idempotency key for one submission attempt.

The backend must reject a duplicate key instead of creating another feedback row.

---

## 10. Feedback → Passport Learning

The MVP does not need a background AI learner.

Initial rule:

`Feedback` is an explicit signal source for future recommendation runs.

Example:

- repeated positive texture feedback can strengthen future texture matching
- repeated negative effect feedback can reduce future effect matching

The first implementation should keep the Passport itself explicit and user-editable.

Do not silently mutate user preferences from inferred behavior.

---

## 11. Cart Integration

Recommendation results must reuse the current canonical Cart path.

### Add One

`Recommendation → canonical product/variant → existing addToCart flow`

### Add All

Add the five recommendations through the same canonical product/variant contract.

Acceptance target:

**Add all five in <= 3 clicks after recommendations are visible.**

No second recommendation-specific cart implementation.

---

## 12. Variant Rules

Variant-aware recommendations are supported from the first implementation.

A recommendation can return:

- product only, when no meaningful variant exists
- product + variant, when a variant is required to purchase

Cart identity remains:

`product_id + product_variant_id + quantity`

Do not store variant identity as a display string only.

---

## 13. RLS / Authorization Contract

All Beauty persistence tables must have RLS enabled.

Customer access model:

- current user can SELECT own Passport
- current user can INSERT/UPDATE own Passport
- current user can SELECT own feedback
- current user can INSERT own feedback
- current user can SELECT own recommendation history

Staff/admin access should be explicit and role-authorized where operational visibility is required.

Never trust a client-supplied owner UUID for authorization.

Do not add SECURITY DEFINER simply to bypass a policy error.

---

## 14. Mobile UX Contract

Beauty MVP is mobile-first.

### Quiz
- one primary question at a time where practical
- visible progress
- touch-friendly answer controls
- back/next always reachable

### Recommendations
- five readable cards
- reason visible without deep navigation
- add-to-cart action obvious
- Add All action persistent/obvious

### Passport
- summary first
- edit/retake action visible
- feedback history compact

### Feedback
- touch-friendly rating
- simple texture/effect controls
- no long form required

No horizontal page overflow.

---

## 15. Detailed Acceptance Tests

### A. Passport persistence
1. Authenticate as customer.
2. Save a known quiz payload.
3. Read Passport.
4. Refresh.
5. Verify values remain unchanged.
6. Verify another user's Passport is not accessible.

### B. Quiz
1. Open Quiz on mobile.
2. Complete 5–7 questions.
3. Verify progress.
4. Verify validation.
5. Verify completion within <= 2 minutes under normal interaction.

### C. Rules engine
1. Load a fixed Passport fixture.
2. Load a fixed catalog fixture.
3. Generate recommendations twice.
4. Assert identical order and scores.
5. Assert max 5 displayed recommendations.
6. Assert each has reason codes.

### D. Explanation
1. Render all five results.
2. Verify every explanation maps to actual reason codes.
3. Verify no unsupported medical/diagnostic wording.

### E. Add All
1. Display five recommendations.
2. Click Add All.
3. Verify canonical Cart contains all eligible products/variants.
4. Verify no duplicate cart rows.

### F. Feedback
1. Submit rating + texture + effect.
2. Verify row belongs to authenticated user.
3. Verify product/variant linkage.
4. Repeat with same idempotency key.
5. Verify duplicate is not created.

### G. Commerce continuity
1. Open Cart from recommendations.
2. Proceed to Checkout.
3. Verify EGP Phase-1 currency.
4. Verify product/variant identity survives Checkout.
5. Do not clear Cart before successful canonical order creation.

### H. Browser gate
Final interactive verification remains:

`Login → Quiz → Passport → Recommendations → Add All → Cart → Checkout → Order → Feedback → Passport refresh`

This is a launch/browser gate and is not replaced by source-level PASS.

---

## 16. Delivery Sequence

### Phase A — Data contract
- create/approve Beauty Passport contract
- create recommendation run/item contracts
- create Beauty Feedback contract
- define RLS policies

### Phase B — Passport persistence
- load/save current user's Passport
- tests

### Phase C — Quiz UI
- mobile-first flow
- persistence
- tests

### Phase D — Rules engine
- deterministic scoring
- reason codes
- ruleset version
- unit/static tests

### Phase E — Recommendation UI
- five cards
- explanation layer
- Add All

### Phase F — Feedback
- form
- idempotency
- persistence
- Passport signal read-back

### Phase G — Variant integration
- product/variant mapping
- Cart compatibility

### Phase H — Regression
- mobile
- desktop
- EN/AR
- dark mode
- existing commerce flows

### Phase I — Browser acceptance
- full end-to-end sequence
- Owner/browser gate

---

## 17. Definition of Done

Sprint 1 Beauty MVP is design-complete when:

- data contracts are explicit
- ownership boundaries are explicit
- RLS model is defined
- recommendation scoring is deterministic
- explanation reasons are inspectable
- feedback is idempotent
- canonical Cart/order paths are reused
- variant identity is preserved
- acceptance tests are executable
- no Owner commercial decision is embedded in engineering code

Implementation can proceed on Restore-Test/local development.

**Production remains FROZEN.**
