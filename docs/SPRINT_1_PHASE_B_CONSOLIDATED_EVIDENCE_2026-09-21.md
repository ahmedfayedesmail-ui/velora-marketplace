# Velora — Sprint 1 Phase B
## Consolidated Evidence — 2026-09-21

**Branch:** `sprint-2-s2d-admin`  
**Environment:** Restore-Test/local only  
**Production:** **FROZEN**

## Executive Result

**Phase B = CLOSED**

| Gate | Result | Evidence |
|---|---|---|
| B1 Passport Persistence | VERIFIED | B1 evidence + B6 regression |
| B2 Recommendation Operation | VERIFIED | B2 evidence + B6 regression |
| B3 24h Cache | VERIFIED | B2 implementation + B6 explicit cache regression |
| B4 Rate Limit | VERIFIED | B2 implementation + B6 explicit rate regression |
| B5 Recommendation Read | VERIFIED | B5 evidence + B6 RLS/read regression |
| B6 Regression | PASS | This consolidated evidence |

## B1

Canonical save operation:

`public.velora_save_beauty_profile(...)`

Verified properties:

- ownership derived from `auth.uid()`;
- supported `beauty-quiz.v1`;
- required goal/concern validation;
- optional/avoidance validation;
- single Passport row per user;
- cross-user reads/updates blocked.

## B2

Canonical recommendation operation:

`public.velora_get_beauty_recommendations()`

Verified properties:

- authenticated-user resolution;
- server-side fingerprint;
- catalog revision;
- deterministic 18-rule scoring;
- canonical product/variant identity;
- recommendation persistence;
- incomplete/no-match domain states;
- legacy recommendation boundary preserved.

## B3

Cache identity:

`user_id + input_fingerprint + ruleset_version + catalog_revision`

Explicit B6 cache regression proved:

- same run ID on identical requests;
- second request `from_cache=true`;
- one rate event after the first calculation + cache hit.

## B4

Explicit B6 regression proved:

- five distinct new calculations succeed;
- sixth distinct new calculation returns `rate_limited`;
- exactly five rate events recorded.

## B5

Canonical read operation:

`public.velora_get_beauty_recommendation_history(p_limit integer default 10)`

Verified:

- SECURITY INVOKER;
- authenticated-only EXECUTE;
- own-history RLS;
- internal input snapshot/fingerprint hidden from authenticated column privileges;
- direct application writes to recommendation runs/items denied.

## RLS Matrix

All Beauty public tables have RLS enabled and active ownership policies:

- `beauty_profiles`
- `beauty_recommendation_runs`
- `beauty_recommendation_items`
- `beauty_feedback`

Customer A own-read = PASS for all four.

Customer A cross-read = PASS / zero rows for all four.

Cross-user feedback insert = rejected.

Anonymous SELECT privileges = denied.

## Legacy Boundary

`public.recommendation_runs` remained empty and untouched by the new Beauty Recommendation operations.

## Static Regression

Duplicate B2 script loading was found during B6 and corrected with a one-line source cleanup.

Post-fix B2 script occurrence in `src/index.html` = 1.

## Final Test Hygiene

Every B6 fixture was transaction-scoped.

Final Restore-Test Beauty state:

- profiles: 0
- recommendation runs: 0
- recommendation items: 0
- feedback: 0
- rate events: 0
- legacy recommendation runs: 0

## Findings Remaining After Phase B

### FIND-BE-027 — GDPR Deletion Flow
**OPEN / PRE-LAUNCH**

Cascade cleanup exists for Beauty-owned relational records, but a complete deletion/retention workflow, evidence trail, backups/export review, and legally required retention treatment are still outstanding.

### FIND-BE-028 — Legacy Recommendation Model Overlap
**OPEN / ARCHITECTURAL**

The existing legacy recommendation model remains in place. Beauty Recommendation uses dedicated Beauty tables/RPCs and does not repurpose the legacy model.

### FIND-BE-029 — Vision vs Data Contract Gap
**OPEN / HIGH / ARCHITECTURAL**

The approved product direction is Routine Discovery, while the current Recommendation contract lacks:

- canonical `skin_type`;
- canonical `routine_budget`;
- a Routine step model.

This moves to Phase C.

## Browser / Launch Gate

Phase B closure does not certify the browser experience.

The separate browser/launch gate still includes customer flow, mobile/desktop, dark mode, EN/AR, checkout, seller/admin visibility, and reported console/network residuals.

## Next Authorized Sequence

`Phase C → Data Contract v2 design → Owner Review Gate → Routine UX → Sprint 1 UI`

The Owner Review Gate is mandatory after the Phase-C Routine model is designed and before any Routine implementation begins.

Production remains **FROZEN**.
