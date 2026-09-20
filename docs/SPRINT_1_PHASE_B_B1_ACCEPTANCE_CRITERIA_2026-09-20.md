# Velora — Sprint 1 Phase B
## B1 Beauty Passport Persistence — Acceptance Criteria — 2026-09-20

**Branch:** `sprint-2-s2d-admin`
**Environment:** Restore-Test/local only
**Production:** **FROZEN**
**Phase:** B1
**Status:** **PASS — Restore-Test/source gate**
**Evidence:** `docs/SPRINT_1_PHASE_B_B1_EVIDENCE_2026-09-20.md`

## 1. Definition of B1 Done

B1 is complete only when the authenticated customer can persist and reload the current Beauty Passport through the canonical application path without ownership leakage, invalid data, or duplicate rows.

B1 does **not** calculate recommendations.

B1 does **not** implement 24h cache.

B1 does **not** implement rate limiting.

B1 does **not** touch `public.recommendation_runs`.

## 2. Functional acceptance

### B1-01 — Create
PASS. Valid save creates exactly one `beauty_profiles` row for the authenticated customer, persists `quiz_version`, and server-generates `updated_at`.

### B1-02 — Read
PASS. The B1 source module reads the current user's Passport through `auth.getUser() → beauty_profiles SELECT` under RLS.

### B1-03 — Update / Upsert
PASS. Repeated save for the same authenticated user updates the existing row; row count remains one.

### B1-04 — Positive persistence round-trip
PASS. Save → read verification preserved all persisted fields used in the test, normalized empty optionals to NULL, and preserved canonical avoidance data.

## 3. Negative security acceptance

### B1-05 — Cross-user SELECT
PASS. Customer B observed zero rows for Customer A.

### B1-06 — Cross-user UPDATE
PASS. Customer B affected zero rows when targeting Customer A; Customer A's stored value remained unchanged.

### B1-07 — Anonymous access
PASS. Anonymous table read and anonymous RPC invocation were rejected.

### B1-08 — Client owner UUID is non-authoritative
PASS. The save RPC has no `user_id` argument and derives ownership from `auth.uid()`.

## 4. Validation acceptance

### B1-09 — Required fields
PASS. Blank/whitespace `goal` or `concern` is rejected as `PASSPORT_INCOMPLETE`.

### B1-10 — Supported quiz version
PASS. Only `beauty-quiz.v1` is accepted; unknown versions are rejected as `UNSUPPORTED_QUIZ_VERSION`.

### B1-11 — Canonical optional values
PASS. Empty optional scalars normalize to NULL.

For B1 `avoidance_preferences`, the approved top-level shape is an object containing only:
- `ingredients`: array of strings
- `tags`: array of strings

Values are normalized by trimming, removing empty values, deduplicating, and sorting. Unknown keys and invalid value types are rejected as `INVALID_AVOIDANCE_PREFERENCES`.

Exact controlled quiz-answer vocabularies remain owned by the versioned quiz contract; B1 does not invent a second quiz vocabulary.

## 5. Incomplete Passport edge cases

### B1-12 — Open before completion
PASS. Missing Passport is mapped by the source read module to `not_started`. No recommendation operation is invoked.

### B1-13 — Partial save
PASS. Required-field validation rejects incomplete saves with `PASSPORT_INCOMPLETE`.

### B1-14 — Egypt context with incomplete profile
PASS. The B1 save API accepts no country/market override and does not fabricate preferences. An incomplete user remains explicitly incomplete.

## 6. RLS acceptance

Verified on Restore-Test:
- `beauty_profiles` RLS enabled;
- customer ownership policies active;
- cross-user SELECT blocked;
- cross-user UPDATE blocked by ownership enforcement;
- anonymous read blocked;
- save RPC is `SECURITY INVOKER`;
- `authenticated_execute = true`;
- `anon_execute = false`.

## 7. Persistence invariants

Verified:
- one Passport row per user;
- no duplicate Passport rows;
- no recommendation rows implicitly created;
- no legacy recommendation rows touched;
- no product/cart/order rows modified by B1 tests.

## 8. Regression acceptance

No B1 change was made to:
- Auth
- Products
- Product Variants
- Cart
- Checkout
- Orders
- Reviews
- Wishlist
- Notifications
- Admin
- legacy recommendation intelligence

## 9. Evidence required to close B1

Evidence is recorded in:
`docs/SPRINT_1_PHASE_B_B1_EVIDENCE_2026-09-20.md`

Implementation artifacts:
- `supabase/migrations/20260920200702_s1_b1_beauty_passport_save_rpc.sql`
- `src/scripts/58-s1-b1-beauty-passport.js`
- `src/index.html`
- `docs/SCRIPT_MANIFEST.json`

Restore-Test migration history:
`20260920200702 / s1_b1_beauty_passport_save_rpc`

## 10. B1 PASS gate

**PASS.**

All B1-01 through B1-14 applicable checks are evidenced on Restore-Test/source verification.

Browser E2E remains a later launch/browser gate and is not inferred from B1 source/SQL tests.
