# Velora — Sprint 1 Phase B
## B2 Canonical Recommendation Operation — Evidence — 2026-09-20

**Branch:** `sprint-2-s2d-admin`  
**Target:** Restore-Test (`arlaxqmhtvjwjbjinjfw`)  
**Production:** **FROZEN**  
**Status:** **PASS — Restore-Test/source gate**  
**Browser:** Not required for engineering PASS; remains a later browser gate.

## 1. Source Investigation Result

Active Supabase client is created in `src/scripts/00-localization.js` and exposed as `window.supabaseClient`.

B2 client module:

`src/scripts/59-s1-b2-beauty-recommendations.js`

Canonical client call:

`supabaseClient.rpc('velora_get_beauty_recommendations')`

No client-supplied Passport owner ID, score, reason codes, ruleset version, catalog revision, or recommendation items are accepted by the B2 client operation.

## 2. Implementation Plan Delivered

B2 now performs:

1. authenticated-user resolution;
2. Passport load;
3. canonical input construction;
4. server-side SHA-256 fingerprint;
5. catalog revision resolution;
6. 24h cache lookup;
7. server-side 5 calculations / 10 minutes rate limit;
8. deterministic `beauty-rules.v1` scoring;
9. up to five recommendation-item persistence;
10. frozen `beauty-recommendation.v1` response.

Cache and rate limit are implementation aspects of this canonical operation; they are not separate browser systems.

## 3. Storage / Security Architecture

Public entry point:

`public.velora_get_beauty_recommendations()`

- `SECURITY INVOKER`
- authenticated EXECUTE only
- anonymous EXECUTE disabled

Internal operation:

`private.velora_beauty_recommendation_operation()`

- `SECURITY DEFINER`
- private schema
- explicit authenticated-user check via `auth.uid()`
- application roles cannot directly execute internal helper functions

Internal rate ledger:

`private.beauty_recommendation_rate_events`

- not exposed to the application
- keyed with a surrogate primary key
- indexed by `user_id, created_at`
- stores calculation attempts, including `no_matches`
- cache hits do not create rate events

Catalog revision:

`private.beauty_catalog_revision`

- scope: `EG-EGP`
- monotonic integer revision
- authoritative product/variant mutation triggers
- no browser/manual/Cron dependency

## 4. Deterministic Rules

Ruleset `beauty-rules.v1` contains exactly 18 documented rules.

Reference:
`docs/SPRINT_1_PHASE_B_B2_RULESET_V1_2026-09-20.md`

Positive weights total 100 points.

Variant identity is canonical `product_id + product_variant_id`.

## 5. Runtime Verification

### B2-01 — Incomplete Passport

Observed:

`status = incomplete`  
`run = null`  
`recommendations = []`  
`next_action = complete_passport`

No recommendation run is created.

### B2-02 — First calculation

Observed:

- `status = success`
- exactly five recommendations returned
- positions 1–5
- scores bounded within 0–100
- reason codes present
- one result selected a real active variant
- EGP currency returned
- `from_cache = false`
- ruleset = `beauty-rules.v1`
- catalog token present
- 24h cache expiry present

### B2-03 — Cache hit

A second identical request returned:

- the **same run ID** as the first calculation;
- `from_cache = true`;
- same recommendations/scores/reason codes.

This proves the cache path reused the persisted calculation rather than creating a second run.

### B2-04 — Rate limit

Five distinct new calculation inputs were executed within the same 10-minute window.

Observed rate-event count:

`5`

The sixth distinct calculation returned:

`status = rate_limited`

with:

`run = null`

and:

`recommendations = []`

The sixth request did not create another rate event.

### B2-05 — Cache does not consume quota

The identical cache-hit request occurred between new calculations and did not increase the rate-event count.

The rate ledger remained based on new calculations only.

### B2-06 — Catalog revision

Before a test product price mutation:

`CATALOG_V1:EG-EGP:8`

After the price mutation:

`CATALOG_V1:EG-EGP:9`

This verifies the authoritative product trigger invalidation path.

### B2-07 — No-match domain result

All fixture products were made unavailable while preserving the transaction scope.

Observed:

`status = no_matches`  
`run = null`  
`recommendations = []`

Run count remained:

`5`

Therefore `no_matches` does not create an empty recommendation run.

### B2-08 — Legacy recommendation boundary

After the test suite:

`public.recommendation_runs = 0`

No legacy recommendation run was created or repurposed by B2.

## 6. Migration History

B2 Restore-Test chain:

1. `20260920201146 / s1_b2_beauty_recommendation_operation`
2. `20260920201409 / s1_b2_digest_schema_fix`
3. `20260920201437 / s1_b2_recommendation_operation_runtime_fix`
4. `20260920201535 / s1_b2_private_helper_acl_hardening`
5. `20260920201605 / s1_b2_private_helper_search_path_and_rate_pk`

All five applications completed successfully.

## 7. Final ACL / Advisor Verification

Public RPC:

- authenticated EXECUTE = true
- anonymous EXECUTE = false

Private operation:

- authenticated EXECUTE = true
- anonymous EXECUTE = false

Private helper functions:

- authenticated EXECUTE = false
- anonymous EXECUTE = false

Security Advisor:

- no B2 Beauty exposed SECURITY DEFINER warning
- remaining Beauty warning concerns the intentionally privileged moderation RPC from Phase A
- private-table RLS notices are INFO and internal-schema only

Performance Advisor:

- remaining Beauty findings are INFO unused-index notices for new tables awaiting workload.

## 8. Final invariants

All runtime fixtures were transaction-scoped and rolled back.

Final test-state expectation:

- `beauty_profiles = 0`
- `beauty_recommendation_runs = 0`
- `beauty_recommendation_items = 0`
- `beauty_feedback = 0`
- `beauty_recommendation_rate_events = 0`
- legacy `recommendation_runs` unchanged / empty

## 9. Implementation Artifacts

- `src/scripts/59-s1-b2-beauty-recommendations.js`
- `src/index.html`
- `docs/SCRIPT_MANIFEST.json`
- `supabase/migrations/20260920201146_s1_b2_beauty_recommendation_operation.sql`
- `supabase/migrations/20260920201409_s1_b2_digest_schema_fix.sql`
- `supabase/migrations/20260920201437_s1_b2_recommendation_operation_runtime_fix.sql`
- `supabase/migrations/20260920201535_s1_b2_private_helper_acl_hardening.sql`
- `supabase/migrations/20260920201605_s1_b2_private_helper_search_path_and_rate_pk.sql`

## 10. Production Control

**No Production DB migration, data change, deployment, or provider configuration change was made.**

B2 is **PASS on Restore-Test/source gate**.

Next authorized engineering phase is B5/B6 regression/read hardening as defined in the Phase B sequence.
