# Velora — Phase C Rules Engine v2 Evidence — 2026-09-21

**Environment:** Restore-Test `arlaxqmhtvjwjbjinjfw`  
**Branch:** `sprint-2-s2d-admin`  
**Production:** **FROZEN**  
**Owner Review Gate:** **APPROVED — 2026-09-21**  
**Verification Status:** **PASSED**

## 1. Engineer Decisions

Within the approved Phase-C scope, no additional Owner decision was required for the following implementation details:

- **Selection model:** deterministic-first, not a B2-style weighted global top-5 result.
- **Routine ordering:** ordered `step_order` 1–6 with explicit `time_of_day` = `am | pm`.
- **Empty Routine:** zero selected products returns `status = no_matches` and no persisted Routine run.
- **Repetition policy:** cleanse max 2, treat max 2, moisturize max 2, protect max 1; protect is AM-only.

These decisions stay inside the Owner-approved Routine model.

## 2. Applied Restore-Test Migrations

The Rules Engine implementation is represented in Restore-Test by:

- `20260921022410 / phase_c_data_contract_v2_foundation`
- `20260921022602 / phase_c_routine_acl_hardening`
- `20260921023715 / phase_c_rules_engine_v2`
- `20260921023756 / phase_c_rules_engine_v2_reason_evidence_fix`
- `20260921023826 / phase_c_rules_engine_v2_digest_search_path_fix`
- `20260921024038 / phase_c_rules_engine_v2_deterministic_selection`
- `20260921024132 / phase_c_rules_engine_v2_helper_search_path_hardening`

No Production migration was applied.

## 3. Step Template

The implemented ordered template is:

| Order | Time | Step | Required |
|---:|---|---|---|
| 1 | AM | cleanse | yes |
| 2 | AM | treat | yes |
| 3 | AM | moisturize | yes |
| 4 | AM | protect | yes |
| 5 | PM | cleanse | optional |
| 6 | PM | treat | optional |

Normal successful output is therefore 4–6 steps.

Database constraints additionally enforce:

- `step_order` 1–6;
- allowed step types only;
- protect = AM-only;
- cleanse/treat/moisturize repetition max 2;
- protect repetition max 1.

## 4. Candidate Eligibility

Every selected candidate must be:

- approved;
- EGP;
- Beauty-resolved;
- purchaseable through product stock or an active/in-stock variant;
- step-eligible;
- not excluded by the customer's avoidance preferences;
- within the running routine budget;
- not a product already selected in another Routine step.

Variant resolution selects only `is_active = true` and `stock_quantity > 0` variants.

## 5. Deterministic Selection

Selection order is now lexicographic/deterministic:

1. hard eligibility;
2. explicit goal match;
3. explicit concern match;
4. known skin-type fit;
5. applicable unit price;
6. canonical product UUID;
7. variant UUID.

No random selection and no global top-5 recommendation scoring is used.

Phase-B `beauty-recommendation.v1` remains untouched.

## 6. Behavioral Verification

All behavioral fixtures were transaction-scoped and rolled back.

### Baseline no-match

With the current real Restore-Test catalog, which has no usable Beauty step metadata for the Routine template:

- `status = no_matches`
- `run = null`
- `steps = []`

No empty Routine run is persisted.

### Positive Routine

With a temporary six-product Beauty fixture:

- status = `complete`;
- **6 steps**;
- **4 AM + 2 PM**;
- **6 distinct selected products**;
- no PM protect rows;
- selected reason codes were non-empty;
- selected total cost = **565 EGP** under the `500_1000` budget;
- identical second execution returned the same step payload (**deterministic repeatability = true**).

### Variant availability

Fixture contained:

- one active/in-stock variant;
- one cheaper inactive variant.

Result:

- active variant was selected;
- inactive variant was never selected.

### Budget

With `routine_budget = under_500`:

- selected cost = **495 EGP**;
- no deliberate budget overrun;
- Routine remained valid within the selected budget band.

### Partial Routine

After making the only eligible AM SPF unavailable:

- Routine status = `partial`;
- protect step = `unavailable`;
- no fabricated replacement was produced.

### Security / output boundary

- `input_fingerprint` is stored internally but **not exposed** in the public Routine JSON response.
- Public RPC: `anon EXECUTE = false`, `authenticated EXECUTE = true`.
- Routine tables remain client-read-only at the table ACL layer.

## 7. Schema Regression

Transaction-scoped negative tests all passed:

- third cleanse repetition → rejected;
- second protect → rejected;
- PM protect → rejected;
- `step_order = 7` → rejected;
- invalid step type → rejected;
- selected without product → rejected;
- selected with empty reason codes → rejected;
- unavailable with product attached → rejected.

## 8. Explanation Model

The engine persists structured `reason_codes` only.

Examples verified in selected steps include:

- `goal_match`
- `concern_match`
- `skin_type_match`
- `step_match`
- `availability_match`
- `budget_fit`

No generated/free-form explanation text is persisted by the engine.

The final customer-facing one-line explanation remains an **Output Contract / UI mapping concern**, not a free-form engine operation.

No location, Cairo, climate, or weather evidence is introduced.

## 9. `not_needed` Boundary

The database contract supports:

`selection_status = not_needed`.

The current approved template does not emit `not_needed` for an optional slot when no candidate exists; an optional slot is omitted from the emitted Routine instead.

Therefore:

- `not_needed` = supported contract state;
- current Rules Engine template = does not exercise that state.

This is intentional and is not treated as a fabricated success.

## 10. Security Advisor

After helper hardening:

- no new Routine-specific Security Advisor finding remains;
- the previous mutable-`search_path` warnings for the new Routine helpers were resolved.

Project-wide pre-existing findings remain outside this change, including unrelated SECURITY DEFINER exposure, `pg_net` placement, and Auth password-protection configuration.

## 11. Clean State

After all verification transactions were rolled back:

- `beauty_profiles` = 0
- `beauty_routine_runs` = 0
- `beauty_routine_steps` = 0
- legacy `recommendation_runs` = 0

No test catalog fixture or Routine result remains persisted.

## 12. Static Regression / Legacy Boundary

Current `src/index.html`:

- `58-s1-b1-beauty-passport.js` → 1 load;
- `59-s1-b2-beauty-recommendations.js` → 1 load;
- `52-s2a-variants.js` → 1 load;
- `57-s2-checkout-e2e.js` → 1 load.

Legacy recommendation functions still exist and the legacy `recommendation_runs` table was not repurposed.

## 13. Result

**Rules Engine v2 Implementation = VERIFIED ✅**

The server-side Routine operation now:

**Passport v2 → Step Template → Eligibility → Deterministic Selection → Ordered Routine**

with no fabricated products and no client-owned write path.

## 14. Next Gate

**Quiz v2 RPC**

Then:

**Routine Output Contract**

Then:

**Routine Verification → Routine UX → Sprint 1 UI**

Production remains **FROZEN**.
