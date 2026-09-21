# Velora — Phase C
## Rules Engine v2 Design — Routine Discovery — 2026-09-21

**Status:** **APPROVED DESIGN — IMPLEMENTATION AUTHORIZED**  
**Production:** **FROZEN**

## 1. Old vs New

### Phase-B engine

`Passport → score all eligible products → top 5`

### Phase-C engine

`Passport v2 → determine Routine step slots → eligible candidates per step → select one per step → ordered Routine`

The Phase-B engine remains unchanged.

## 2. Step Generation

Maximum Routine length:

**6 steps**

Allowed step types:

- `cleanse`
- `treat`
- `moisturize`
- `protect`

Normal Routine output is 4–6 steps.

Six is the maximum, not a mandatory output size. A partial/no-match outcome may contain fewer only when required catalog eligibility is unavailable; no step is fabricated.

Repetition limits: `cleanse` max 2 (AM + PM), `treat` max 2, `moisturize` max 2, `protect` max 1 (morning SPF). The ruleset determines whether a repeated slot is actually needed.

## 3. Candidate Eligibility

Before scoring or tie-breaking, a product must be:

- approved;
- EGP;
- Beauty-resolved;
- purchaseable;
- not excluded by avoidance preferences;
- eligible for the specific step.

Unknown catalog metadata is not a positive match.

## 4. Passport Signals

v2 uses:

- `skin_type`
- `goal`
- `routine_budget`
- existing optional preferences when present.

The engine must use only explicit values.

### Unknown skin type

`unknown` means:

- no skin-type inference;
- no skin-type claim;
- no automatic exclusion solely because the user selected unknown.

## 5. Budget Rule

`routine_budget` is evaluated as a routine-level EGP constraint.

The solver must not deliberately exceed the selected band.

A candidate that causes the routine to exceed the budget is not eligible for that selection unless the Owner explicitly approves a future relaxation rule.

## 6. Deterministic Selection

For each step:

1. hard eligibility;
2. strongest explicit goal/concern evidence;
3. skin-type fit when known;
4. budget fit;
5. availability;
6. lowest applicable price;
7. product UUID ASC;
8. variant UUID ASC.

One product selection maximum per step.

Default: do not reuse the same product in multiple steps.

## 7. Missing Steps

### Optional + no candidate

Mark `not_needed` when the ruleset determines the step is unnecessary.

Mark `unavailable` when the step is desired but the catalog has no eligible product.

### Required + no candidate

Mark `unavailable`.

Routine status becomes `partial`.

Never:

- fabricate a product;
- invent a step result;
- substitute an ineligible product merely to fill the slot.

## 8. Explanation Source

Every selected step should have structured reason codes.

The UI converts reason codes to one sentence.

Example:

`skin_type_match + goal_match → "لأن بشرتك دهنية وهدفك تقليل اللمعان."`

No free-form generative text.

## 9. Versioning

Proposed ruleset identifier:

`beauty-rules.v2`

Breaking ruleset changes require an explicit new version.

## 10. Implementation Preconditions — Satisfied

Owner approval was recorded on 2026-09-21 for:

- step-generation and repetition policy;
- approved EGP budget bands;
- deterministic precedence;
- missing-step semantics;
- explanation model.

**Migration and implementation are authorized within this scope. Production remains FROZEN.**
