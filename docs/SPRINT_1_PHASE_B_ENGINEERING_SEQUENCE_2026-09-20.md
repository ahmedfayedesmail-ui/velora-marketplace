# Velora — Sprint 1 Phase B
## Beauty Passport + Recommendation Operation — Engineering Sequence — 2026-09-20

**Branch:** `sprint-2-s2d-admin`
**Environment:** Restore-Test/local only
**Production:** **FROZEN**

## Phase B pre-implementation gates — LOCKED

The following design contracts were frozen before implementation:

1. `docs/SPRINT_1_PHASE_B_OUTPUT_CONTRACT_2026-09-20.md`
2. `docs/SPRINT_1_PHASE_B_FINGERPRINT_SPEC_2026-09-20.md`
3. `docs/SPRINT_1_PHASE_B_CATALOG_REVISION_SPEC_2026-09-20.md`
4. `docs/SPRINT_1_PHASE_B_B1_ACCEPTANCE_CRITERIA_2026-09-20.md`

## Phase B order

### B1 — Beauty Passport Persistence — VERIFIED

Evidence:
`docs/SPRINT_1_PHASE_B_B1_EVIDENCE_2026-09-20.md`

### B2 — Canonical Recommendation Operation — VERIFIED

B2 includes the approved cache/rate-limit implementation aspects:

- authenticated-user resolution;
- Passport input construction;
- server-side SHA-256 fingerprint;
- catalog revision resolution;
- 24h cache lookup;
- 5 new calculations / 10 minutes server-side rate limit;
- 18-rule deterministic scorer;
- canonical product/variant persistence;
- frozen `beauty-recommendation.v1` output.

Evidence:
`docs/SPRINT_1_PHASE_B_B2_EVIDENCE_2026-09-20.md`

Ruleset:
`docs/SPRINT_1_PHASE_B_B2_RULESET_V1_2026-09-20.md`

### B3 — 24h Cache — COVERED BY B2

Cache reuse is part of the canonical operation.

A valid hit matches:

`user_id + input_fingerprint + ruleset_version + catalog_revision`

and is within 24 hours.

Cache hits:
- return the existing run;
- set `from_cache=true`;
- do not create a run;
- do not consume rate quota.

### B4 — Rate Limit — COVERED BY B2

Server-side limit:

**5 new calculations / 10 minutes / authenticated user**

Implementation uses a private rate-event ledger so `no_matches` can be rate-limited without creating an empty recommendation run.

Cache hits do not create rate events.

### B5 — Recommendation Read Contract — VERIFIED

Customer reads only their own persisted recommendation history through RLS.

The browser does not submit:
- arbitrary scores;
- reason codes;
- ruleset versions;
- catalog revisions;
- owner UUIDs.

### B6 — Regression + Phase Close — VERIFIED

B6 completed a full Phase-B domain regression:
- B1 save/read + validation;
- B2 recommendation operation;
- B3 cache;
- B4 rate limit;
- catalog revision invalidation;
- no-match behavior;
- B5 read contract;
- RLS across all four Beauty public tables;
- anonymous access/EXECUTE boundaries;
- direct recommendation write privileges;
- legacy recommendation boundary;
- static B1/B2 script integration.

Broader Sprint 2 marketplace/browser regression remains a separate later launch gate.

## Why Persistence comes first

The Passport is the authoritative input state for every deterministic recommendation calculation.

Therefore:

**Design contracts → Persistence → Recommendation Operation → Cache + Rate Limit → Read → Regression**

## Phase B non-goals

- No AI/ML recommendation
- No Production changes
- No repurposing of `public.recommendation_runs`
- No commercial pricing decisions
- No browser PASS inferred from source tests
- No silent contract changes

## Current status

**B1 VERIFIED + B2 VERIFIED + B3/B4 VERIFIED + B5 VERIFIED + B6 VERIFIED — PHASE B CLOSED.**

FIND-BE-029 remains **OPEN / HIGH / ARCHITECTURAL** for Phase C.

Next sequence: **FIND-BE-029 → Phase C Data Contract v2 → Owner Review Gate → Routine UX → Sprint 1 UI.**

