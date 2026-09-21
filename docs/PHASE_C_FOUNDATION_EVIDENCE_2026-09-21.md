# Velora — Phase C Foundation Evidence — 2026-09-21

**Environment:** Restore-Test `arlaxqmhtvjwjbjinjfw`  
**Branch:** `sprint-2-s2d-admin`  
**Production:** **FROZEN**  
**Owner Review Gate:** **APPROVED — 2026-09-21**  
**Verification Status:** **PASSED**

## 1. SCHEMA_SUMMARY

### Passport v2 foundation

`public.beauty_profiles` contains:

- `skin_type`: text, controlled by CHECK
  - `oily`
  - `dry`
  - `combination`
  - `normal`
  - `unknown`
- `routine_budget`: text, controlled by CHECK
  - `under_500`
  - `500_1000`
  - `1000_2000`
  - `over_2000`
  - `unknown`

The fields remain nullable at the storage layer during the v1→v2 transition. Quiz v2 writer logic will require valid v2 values.

### Routine runs

`public.beauty_routine_runs`

- PK: `id`
- owner: `user_id → beauty_profiles.user_id`
- contract: `beauty-routine.v1`
- ruleset: `beauty-rules.v2`
- status: `complete | partial | no_matches`
- server fields: `catalog_revision`, `input_fingerprint`
- timestamps: `created_at`

### Routine steps

`public.beauty_routine_steps`

- PK: `id`
- parent: `routine_run_id`
- `step_order`: CHECK 1–6
- `step_type`: CHECK `cleanse | treat | moisturize | protect`
- `selection_status`: CHECK `selected | unavailable | not_needed`
- `is_optional`: boolean
- `product_id`: nullable FK to products
- `product_variant_id`: nullable FK to product_variants
- `reason_codes`: text[]
- UNIQUE: `(routine_run_id, step_order)`

**Important:** These are controlled text contracts enforced by CHECK constraints, not separate PostgreSQL ENUM types.

### Step consistency

Database CHECK rules enforce:

- selected → product required + non-empty reason codes;
- unavailable/not_needed → no product and no variant;
- one emitted row per step order inside a Routine.

The AM/PM repetition limits approved by Owner are intentionally rules-engine behavior, not duplicated as hard schema constraints.

## 2. RLS_MATRIX

| Surface | Customer own | Customer cross-user | Staff cross-user | Anonymous |
|---|---|---|---|---|
| beauty_routine_runs | SELECT ✅ | 0 ✅ | 0 ✅ | denied ✅ |
| beauty_routine_steps | SELECT ✅ | 0 ✅ | 0 ✅ | denied ✅ |

Policies verified:

- `beauty_routine_runs_own_read`
- `beauty_routine_steps_own_read`

Routine steps inherit ownership through their parent Run; the policy joins to `beauty_routine_runs` and checks the authenticated user's ID.

**Staff access decision:** No global staff bypass exists in the Foundation layer. Staff can only see a Routine if they are also the Routine owner. A future staff-read contract must be introduced explicitly rather than weakening customer RLS.

### Cross-user JOIN verification

Authenticated Customer A queried Routine Steps joined through Runs while targeting Customer B's owner ID:

**cross-user JOIN rows = 0**

This confirms the child-table policy does not leak rows through joins.

## 3. FK_DELETE_MATRIX

| FK | ON DELETE | Verification |
|---|---|---|
| beauty_routine_steps.routine_run_id → beauty_routine_runs.id | CASCADE | behavioral PASS |
| beauty_routine_runs.user_id → beauty_profiles.user_id | CASCADE | behavioral PASS |
| beauty_routine_steps.product_id → products.id | RESTRICT | catalog constraint PASS |
| beauty_routine_steps.product_variant_id → product_variants.id | SET NULL | catalog constraint PASS |

Behavioral cascade tests were transaction-scoped and rolled back.

## 4. ACL

Effective client table grants:

- `authenticated` → SELECT only on both Routine tables.
- `anon` → no table grant.

No client INSERT / UPDATE / DELETE / TRUNCATE / REFERENCES / TRIGGER access remains on the Routine tables.

## 5. STATIC_REGRESSION

Current `src/index.html` on `sprint-2-s2d-admin`:

- `scripts/58-s1-b1-beauty-passport.js` → **1 occurrence** ✅
- `scripts/59-s1-b2-beauty-recommendations.js` → **1 occurrence** ✅

Adjacent existing critical scripts also remain single-loaded:

- `52-s2a-variants.js` → 1
- `57-s2-checkout-e2e.js` → 1

No Phase C file added a second B1/B2 loader.

## 6. LEGACY_BOUNDARY

Legacy `public.recommendation_runs` remains a separate domain.

Verification:

- current legacy row count = **0**
- legacy functions still exist:
  - `velora_get_recommendations`
  - `velora_get_recommendation_intelligence`
  - `velora_get_recommendation_quality`
  - `velora_record_recommendation_feedback`
- Phase C migrations do not repurpose the legacy recommendation tables.

Phase-B `beauty-recommendation.v1` remains unchanged.

## 7. CLEAN_STATE

After all transaction-scoped verification fixtures were rolled back:

- `beauty_profiles` = 0
- `beauty_routine_runs` = 0
- `beauty_routine_steps` = 0
- `recommendation_runs` = 0

No verification fixture remains in Restore-Test.

## 8. RESULT

**Routine Verification = PASSED ✅**

No schema defect found.  
No RLS leakage found.  
No unexpected Staff bypass found.  
FK delete semantics match the approved contract.  
B1/B2 static integration remains single-loaded.  
Legacy recommendation boundary remains intact.

### Next Engineering Gate

**Rules Engine v2 Implementation**

Then:

**Quiz v2 RPC → Routine Output Contract → Routine Verification → Routine UX → Sprint 1 UI**

Production remains **FROZEN**.
