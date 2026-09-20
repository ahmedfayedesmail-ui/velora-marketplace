# Velora — Sprint 1 Phase B
## Beauty Passport + Recommendation Operation — Engineering Sequence — 2026-09-20

**Branch:** `sprint-2-s2d-admin`
**Environment:** Restore-Test/local only
**Production:** **FROZEN**

## Phase B pre-implementation gates — LOCKED

Before B1 implementation, the following design contracts are frozen:

1. `docs/SPRINT_1_PHASE_B_OUTPUT_CONTRACT_2026-09-20.md`
2. `docs/SPRINT_1_PHASE_B_FINGERPRINT_SPEC_2026-09-20.md`
3. `docs/SPRINT_1_PHASE_B_CATALOG_REVISION_SPEC_2026-09-20.md`
4. `docs/SPRINT_1_PHASE_B_B1_ACCEPTANCE_CRITERIA_2026-09-20.md`

These four documents are the design gate for B1/B2 and are not production authorization.

## Phase B order

### B1 — Beauty Passport Persistence

Implement and verify:

- current-user Beauty Passport read
- current-user Beauty Passport upsert
- session-derived ownership
- validation of controlled fields
- quiz version persistence
- explicit user-editable preferences
- no client-selected owner authorization

Acceptance:
`Auth → Save Passport → Read → Refresh → Same values`

B1 does not calculate recommendations and does not implement cache/rate limiting.

### B2 — Recommendation Operation

Build one canonical server-side operation that:

1. resolves authenticated user;
2. loads current `beauty_profiles`;
3. builds the deterministic input snapshot according to the fingerprint specification;
4. computes the server-side SHA-256 input fingerprint;
5. resolves the `CATALOG_V1:EG-EGP:<revision>` token;
6. checks the 24h reusable result;
7. enforces the 5 runs / 10 minutes rate limit only when a new calculation is required;
8. executes the 18-rule deterministic scorer;
9. persists `beauty_recommendation_runs`;
10. persists up to five `beauty_recommendation_items`;
11. returns the frozen `beauty-recommendation.v1` output contract.

### B3 — 24h Cache

Reuse an existing compatible run when:

`user_id + input_fingerprint + ruleset_version + catalog_revision`

match and the run is within 24 hours.

A changed Passport, ruleset, or catalog revision produces a new calculation.

A cache hit does not create a new run and does not consume the new-calculation quota.

### B4 — Rate Limit

Apply:

**5 new calculations / 10 minutes / authenticated user**

The limit is enforced server-side.

Cache hits are exempt from the quota because they are reads of an already valid calculation.

### B5 — Recommendation Read Contract

Customer reads only own runs/items through RLS.

The browser does not submit arbitrary scores, reason codes, catalog revisions, ruleset versions, or owner UUIDs for persistence.

### B6 — Regression

Verify the new operation does not modify:

- legacy `recommendation_runs`
- existing recommendation RPC behavior
- Cart
- Checkout
- Orders
- Variants
- Reviews
- Wishlist
- Notifications

Re-run RLS positive/negative tests for all new Beauty tables and the canonical recommendation operation.

## Why Persistence comes first

The Passport is the authoritative input state for every deterministic recommendation calculation.

Without a stable persisted Passport, cache keys and rate-limit semantics would be tied to transient UI state.

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

**PRE-B1 — design gates locked; implementation not started.**
