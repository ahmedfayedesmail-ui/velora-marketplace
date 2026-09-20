# Velora — Sprint 1 Phase B
## Beauty Passport + Recommendation Operation — Engineering Sequence — 2026-09-20

**Branch:** `sprint-2-s2d-admin`
**Environment:** Restore-Test/local only
**Production:** **FROZEN**

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

### B2 — Recommendation Operation

Build one canonical server-side operation that:

1. resolves authenticated user;
2. loads current `beauty_profiles`;
3. builds the deterministic input snapshot;
4. computes the input fingerprint;
5. resolves `catalog_revision`;
6. checks the 24h reusable result;
7. enforces the 5 runs / 10 minutes rate limit only when a new calculation is required;
8. executes the 18-rule deterministic scorer;
9. persists `beauty_recommendation_runs`;
10. persists up to five `beauty_recommendation_items`;
11. returns canonical product/variant identifiers + reason codes.

### B3 — 24h Cache

Reuse an existing compatible run when:

`user_id + input_fingerprint + ruleset_version + catalog_revision`

match and the run is within 24 hours.

A changed Passport, ruleset, or catalog revision produces a new calculation.

### B4 — Rate Limit

Apply:

**5 new calculations / 10 minutes / authenticated user**

Cache hits should not consume a new-calculation quota.

The limit should be enforced server-side, not in browser state.

### B5 — Recommendation Read Contract

Customer reads only own runs/items through RLS.

The browser does not submit arbitrary scores or reason codes for persistence.

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

## Why Persistence comes first

The Passport is the authoritative input state for every deterministic recommendation calculation.

Without a stable persisted Passport, cache keys and rate-limit semantics would be tied to transient UI state.

Therefore:

**Persistence → Recommendation Operation → Cache + Rate Limit → UI**

## Phase B non-goals

- No AI/ML recommendation
- No Production changes
- No repurposing of `public.recommendation_runs`
- No commercial pricing decisions
- No browser PASS inferred from source tests
