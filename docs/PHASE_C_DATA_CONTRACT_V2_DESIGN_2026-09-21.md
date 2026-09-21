# Velora — Phase C
## Data Contract v2 + Routine Discovery Design — 2026-09-21

**Branch:** `sprint-2-s2d-admin`  
**Environment:** Design only / Restore-Test target for later implementation  
**Production:** **FROZEN**  
**Status:** **DESIGN DRAFT — OWNER REVIEW REQUIRED**  
**Finding:** FIND-BE-029 — Vision vs Data Contract Gap

## 1. Decision

Beauty Passport is now treated as **Routine Discovery**.

Approved product principle:

> Beauty Passport exists to turn beauty-product confusion into one clear, trustworthy routine with the least possible effort.

The Phase-C contract therefore moves from:

`Passport → ranked top-5 recommendations`

to:

`Passport v2 → deterministic Routine → ordered Routine Steps → canonical products/variants`

The existing Phase-B contract `beauty-recommendation.v1` remains intact and is not silently mutated.

## 2. Phase-C Boundary

Phase C will define:

1. Beauty Passport v2 input contract.
2. Routine output contract.
3. Rules Engine v2 step mapping.
4. Missing/optional-step behavior.
5. Consumer-language Quiz v2.
6. One-line, evidence-derived explanations.

No implementation is authorized by this design document.

## 3. Beauty Passport v2

### Existing canonical entity

The existing `public.beauty_profiles` row remains the single persisted Passport owned by the authenticated customer.

### New columns

| Column | Logical type | Required | Controlled values / semantics |
|---|---|---:|---|
| `skin_type` | text | yes | `oily`, `dry`, `combination`, `normal`, `unknown` |
| `routine_budget` | text | yes | EGP budget band: `under_500`, `500_1000`, `1000_2000`, `over_2000`, `unknown` |

`unknown` is an explicit user choice. It is not permission for the engine to infer a value.

### Versioning

`beauty_profiles.quiz_version` moves to:

`beauty-quiz.v2`

The v1 row shape remains backwards-compatible for existing records until an explicit migration/transition strategy is implemented.

## 4. Quiz v2

The minimum customer path is exactly three consumer-language questions.

### Q1 — Skin type

**UI:** `بشرتك عاملة إزاي؟`

Answers:

- دهنية
- جافة
- مختلطة
- عادية
- مش عارفة

Persisted as `skin_type`.

### Q2 — Primary goal

**UI:** `إيه أكبر حاجة عايزة تحسّنيها؟`

The answer is persisted into the existing canonical `goal` field using the approved controlled vocabulary.

The vocabulary must remain cosmetic/shopping-oriented and must not turn the Passport into a medical diagnosis.

### Q3 — Routine budget

**UI:** `ميزانيتك للروتين؟`

Answers map to the controlled EGP budget bands in `routine_budget`, plus:

- مش عارفة

### Optional follow-ups

Existing optional preferences may remain available after the three-question path:

- `concern`
- `texture_preference`
- `effect_preference`
- `avoidance_preferences`
- `shopping_priority`

They must not be required to complete the minimum discovery path unless the Owner later approves a different contract.

## 5. Routine Domain Model

Phase C introduces a separate Routine domain.

### Table A — beauty_routine_runs

Purpose: one deterministic Routine Discovery calculation.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid | yes | PK |
| `user_id` | uuid | yes | FK to `beauty_profiles.user_id`, ownership anchor |
| `contract_version` | text | yes | New Routine contract, proposed `beauty-routine.v1` |
| `ruleset_version` | text | yes | Proposed `beauty-rules.v2` |
| `catalog_revision` | text | yes | Server-resolved catalog revision |
| `input_fingerprint` | text | yes | Server-derived Passport-v2 fingerprint |
| `status` | text | yes | `complete`, `partial`, or `no_matches` |
| `created_at` | timestamptz | yes | Server timestamp |

The Routine run is a new domain artifact. It does not repurpose `beauty_recommendation_runs`.

### Table B — beauty_routine_steps

Purpose: ordered Routine steps generated from the Routine ruleset.

| Column | Type | Required | Notes |
|---|---|---:|---|
| `id` | uuid | yes | PK |
| `routine_run_id` | uuid | yes | FK to `beauty_routine_runs.id` |
| `step_order` | smallint | yes | 1–6; unique per Routine |
| `step_type` | text | yes | `cleanse`, `treat`, `moisturize`, `protect` |
| `is_optional` | boolean | yes | Whether the step may be absent without being a Routine defect |
| `selection_status` | text | yes | Proposed: `selected`, `unavailable`, `not_needed` |
| `product_id` | uuid | no | FK to canonical `products.id`; required when selected |
| `product_variant_id` | uuid | no | FK to canonical `product_variants.id`; nullable |
| `reason_codes` | text[] | yes when selected | Structured evidence for explanation |
| `created_at` | timestamptz | yes | Server timestamp |

### Step model rule

`step_order` is sequencing, not a promise that every Routine contains six steps.

A Routine may contain fewer than six steps.

The four allowed step types may repeat only when the v2 ruleset explicitly creates a distinct step slot.

No step is fabricated merely to reach six rows.

## 6. Optional / Missing Step Handling

This is a core contract rule.

### Selected step

`selection_status = selected`

Requires:

- `product_id`
- optional `product_variant_id`
- non-empty `reason_codes`

### Optional step not needed

`selection_status = not_needed`

The Routine is still valid.

### Step unavailable in catalog

`selection_status = unavailable`

No product is attached.

The customer-facing experience must not invent or substitute a product that is not eligible.

### Required step unavailable

If a step marked non-optional has no eligible catalog product, the Routine may be:

`status = partial`

The system must state the missing step truthfully rather than fabricate a result.

## 7. Rules Engine v2

The engine no longer selects the top five products globally.

It performs:

`Passport v2 → Step Template → Step Eligibility → One Selection per Step → Ordered Routine`

### Hard eligibility

Every candidate must satisfy the catalog-driven rules for the step, including:

- approved product status;
- EGP currency;
- purchasable availability;
- Beauty category resolution;
- user avoidance rules;
- step-specific product eligibility.

### Skin type

When `skin_type` is known, it may be used as an explicit matching signal.

When `skin_type = unknown`:

- do not infer skin type;
- do not claim a skin-type match;
- do not exclude a product solely because the user declined to specify a type.

Catalog fields that are absent/empty are never treated as a positive match.

### Budget

`routine_budget` is an EGP routine budget band, not a medical or financial profile.

The engine must treat it as a deterministic shopping constraint.

The routine should not deliberately exceed the selected budget band.

When no eligible candidate can satisfy a step within the allowed budget:

- optional step → `not_needed` or `unavailable`, depending on why it was omitted;
- required step → `unavailable` and Routine may become `partial`.

### One-per-step selection

Each emitted step gets at most one product/variant selection.

The default rule is one product used once per Routine.

A future ruleset may explicitly authorize legitimate product reuse; it must not happen accidentally.

### Deterministic tie-breaking

For equivalent candidates, selection order is deterministic.

Proposed precedence:

1. hard eligibility;
2. strongest explicit goal/concern fit;
3. known skin-type fit;
4. budget fit;
5. availability;
6. lowest applicable unit price;
7. canonical product UUID ascending;
8. variant UUID ascending when needed.

No randomness.

## 8. Routine Explanation Model

The system does not store free-form AI explanations.

It stores structured `reason_codes` and renders a deterministic one-line explanation from real inputs and rule evidence.

Approved principle:

> One line. Real data. No invented context.

Example:

**`لأن بشرتك دهنية وهدفك تقليل اللمعان.`**

This is valid only when both the stored skin type and goal were actually used as supporting evidence.

No `Cairo`, weather, climate, or location claim is permitted in Phase C unless those inputs are later added to the canonical contract and ruleset.

When `skin_type = unknown`, the explanation must not manufacture one. Example structure:

**`لأنه مناسب لهدفك الأساسي ومتاح ضمن ميزانيتك.`**

The exact wording remains subject to Owner Review.

## 9. Read / Write Architecture

Phase C follows the same security principles established in Phase B:

- customer identity derives from Supabase Auth;
- no client-selected owner UUID is authoritative;
- calculation inputs are server-validated;
- Routine persistence is server-controlled;
- customers read only their own Routine history;
- internal fingerprints/snapshots remain non-client-readable;
- direct arbitrary Routine writes are not part of the customer API.

Phase-B Recommendation history remains available as a separate contract during transition.

## 10. Compatibility with Phase B

The following remain unchanged:

- `beauty-recommendation.v1`
- B1/B2/B3/B4/B5 implementation
- legacy `public.recommendation_runs`
- existing Beauty feedback model
- Production freeze

Phase C introduces new versioned artifacts instead of silently changing Phase-B behavior.

## 11. Proposed Acceptance Criteria

A Phase-C implementation may proceed only when the Owner has approved this design and all of the following are specified:

1. Passport v2 field names and controlled values.
2. Three Quiz v2 questions and visible answer labels.
3. Routine step types and sequencing policy.
4. Optional/missing step behavior.
5. Budget semantics.
6. Rules Engine v2 deterministic selection order.
7. Explanation wording rules.
8. Routine persistence and RLS model.
9. Compatibility boundary with `beauty-recommendation.v1`.

## 12. Mandatory Review Gate

**Implementation is BLOCKED until Owner Review.**

The Owner must explicitly review and approve:

- Routine model;
- Quiz v2 questions;
- controlled answer vocabularies;
- budget semantics;
- explanation model;
- missing-step behavior.

Only after approval may migration and implementation begin.

## 13. Explicit Non-goals

- no database migration in this document;
- no frontend implementation;
- no Routine RPC implementation;
- no B2 rewrite;
- no AI/ML;
- no medical diagnosis or treatment claims;
- no location inference;
- no fabricated products or steps;
- no Production change.

## 14. Status

**Phase C Data Contract v2 = DESIGN DRAFT**

**Owner Review Gate = REQUIRED**

**Implementation = BLOCKED pending Owner approval**

**Production = FROZEN**
