# Velora — Sprint 1 Phase B
## B6 Regression + Phase Close Evidence — 2026-09-21

**Branch:** `sprint-2-s2d-admin`  
**Target:** Restore-Test (`arlaxqmhtvjwjbjinjfw`)  
**Production:** **FROZEN**  
**Status:** **PASS — Phase B regression/source gate**  
**Browser:** Separate later browser/launch gate.

## 1. B6 Scope

B6 was executed as a real Phase-B regression, not as a documentation-only close.

Coverage:

- B1 Passport save/read
- B1 validation rejection
- B2 recommendation operation
- B3 24h cache behavior
- B4 5-new-calculations / 10-minute rate limit
- catalog revision invalidation
- no-match behavior
- B5 recommendation read contract
- RLS isolation on all four Beauty public tables
- anonymous access/EXECUTE boundaries
- direct-write privilege hardening
- legacy recommendation boundary
- static script integration check

Broader Sprint 2 marketplace browser regression remains a separate launch/browser gate and was not reclassified as a Phase-B database regression.

## 2. B1 Regression

### B1-REG-01 — Save + Read Round Trip
**PASS**

Authenticated test customer:

- saved `beauty-quiz.v1`;
- persisted `goal=hydration`;
- persisted `concern=dryness`;
- re-read the same owned row;
- row count remained one.

### B1-REG-02 — Invalid Quiz Version
**PASS**

Unsupported quiz version was rejected with the expected validation path.

All test data remained transaction-scoped.

## 3. B2/B3/B4 Regression

### B2-REG-01 — First Recommendation Calculation
**PASS**

Returned `status=success` with recommendation output from the canonical B2 operation.

### B3-REG-01 — Cache Hit
**PASS**

Two identical requests returned:

- the same recommendation run ID;
- second request `from_cache=true`;
- one rate-limit event total after the two calls.

This confirms cache reuse does not consume new-calculation quota.

### B4-REG-01 — Rate Limit
**PASS**

Five distinct new calculation inputs succeeded.

The sixth distinct new calculation returned:

`status=rate_limited`

Observed rate-event count after the five successful calculations:

`5`

The rate-limited request did not create a sixth rate event.

### B2-REG-02 — Catalog Revision Invalidation
**PASS**

A product price mutation advanced the server-side catalog revision.

A recommendation request after that revision change returned `status=success`, proving the previous cache identity no longer applied to the changed catalog state.

### B2-REG-03 — No-Match
**PASS**

When the only transaction-scoped eligible fixture was made unavailable:

- `status=no_matches`
- no recommendation run was created

Run count before and after the no-match request was unchanged.

## 4. B5 Regression

### B5-REG-01 — Read Contract
**PASS**

`beauty-recommendation-read.v1` returned persisted recommendation history.

The response exposed only read-contract fields and omitted:

- `input_snapshot`
- `input_fingerprint`

### B5-REG-02 — Cross-User Read Isolation
**PASS**

The authenticated test customer saw only their own records across the recommendation read path.

### B5-REG-03 — Direct Write Boundary
**PASS**

Authenticated application roles no longer have direct INSERT/UPDATE privileges for recommendation runs/items.

B2 remains the authoritative recommendation writer.

## 5. RLS Re-Verification

All four Beauty public tables were re-checked:

| Table | RLS | Customer-own read | Cross-user read |
|---|---|---|---|
| `beauty_profiles` | enabled | PASS | PASS (0) |
| `beauty_recommendation_runs` | enabled | PASS | PASS (0) |
| `beauty_recommendation_items` | enabled | PASS | PASS (0) |
| `beauty_feedback` | enabled | PASS | PASS (0) |

Additional negative checks:

- cross-user Beauty Feedback insert: **PASS — rejected**
- anonymous table SELECT privileges: **PASS — denied**
- B1/B2/B5 anonymous RPC EXECUTE: **PASS — denied**
- authenticated B1/B2/B5 RPC EXECUTE: **PASS — allowed**
- recommendation run/item direct INSERT/UPDATE: **PASS — denied**

Final policy inventory:

- `beauty_profiles`: 3 policies
- `beauty_recommendation_runs`: 1 policy
- `beauty_recommendation_items`: 1 policy
- `beauty_feedback`: 2 policies

All four tables have RLS enabled.

## 6. Legacy Boundary

**PASS**

`public.recommendation_runs` remained untouched.

During regression, legacy recommendation run count remained:

`0`

No B1/B2/B5 operation repurposed the legacy recommendation model.

## 7. Static Integration Regression

Source audit found a duplicate load of:

`scripts/59-s1-b2-beauty-recommendations.js`

The duplicate script tag was removed as a minimal B6 regression fix.

Post-fix source verification:

- B1 script load: 1
- B2 script load: 1

No UI/browser PASS is inferred from this source check.

## 8. Fixture Hygiene / Final State

All regression fixtures were transaction-scoped and rolled back.

Post-regression Restore-Test state:

- `beauty_profiles = 0`
- `beauty_recommendation_runs = 0`
- `beauty_recommendation_items = 0`
- `beauty_feedback = 0`
- `private.beauty_recommendation_rate_events = 0`
- legacy `recommendation_runs = 0`

## 9. Advisor Boundary

Supabase Security Advisor remains limited to pre-existing project-wide findings and intentional/internal Beauty conditions; B5/B6 introduced no new Beauty-specific exposed SECURITY DEFINER issue.

Performance Advisor continues to show INFO unused-index notices for Beauty recommendation indexes awaiting workload.

## 10. Phase B Result

**B6 = PASS**

Therefore:

**Phase B = CLOSED**

No Production migration, data change, deployment, provider configuration, or credential change was performed.
