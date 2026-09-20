# Velora — Sprint 1 Phase B
## B1 Beauty Passport Persistence — Acceptance Criteria — 2026-09-20

**Branch:** `sprint-2-s2d-admin`
**Environment:** Restore-Test/local only
**Production:** **FROZEN**
**Phase:** B1
**Status:** PRE-IMPLEMENTATION CONTRACT

## 1. Definition of B1 Done

B1 is complete only when the authenticated customer can persist and reload the current Beauty Passport through the canonical application path without ownership leakage, invalid data, or duplicate rows.

B1 does **not** calculate recommendations.

B1 does **not** implement 24h cache.

B1 does **not** implement rate limiting.

B1 does **not** touch `public.recommendation_runs`.

## 2. Functional acceptance

### B1-01 — Create

Given an authenticated customer with a valid completed Passport payload:

- save succeeds;
- exactly one `beauty_profiles` row exists for that customer;
- stored values match the canonical normalized input;
- `quiz_version` is persisted;
- `updated_at` is server-generated.

### B1-02 — Read

The same customer can read the Passport through the canonical read path and receives the stored values unchanged after page refresh/session reload.

### B1-03 — Update / Upsert

Saving a changed Passport updates the existing row instead of creating a second Passport.

Assert:

`count(beauty_profiles where user_id = customer) = 1`

after repeated saves.

### B1-04 — Positive persistence round-trip

`Auth → Save → Read → Refresh/Reload → Read`

must preserve:

- goal
- concern
- texture_preference
- effect_preference
- avoidance_preferences
- shopping_priority
- quiz_version

## 3. Negative security acceptance

### B1-05 — Cross-user SELECT

Customer A cannot read Customer B's `beauty_profiles` row.

Expected result:

- no row leakage;
- no ownership bypass;
- RLS remains enabled.

### B1-06 — Cross-user UPDATE

Customer A cannot modify Customer B's Passport by submitting Customer B's UUID.

Expected result:

- zero affected rows / authorization rejection;
- Customer B's stored values remain unchanged.

### B1-07 — Anonymous access

Unauthenticated users cannot read or write Beauty Passport data.

### B1-08 — Client owner UUID is non-authoritative

A client-supplied `user_id` cannot be used to select the owner of a save operation.

The server derives ownership from the authenticated session.

## 4. Validation acceptance

### B1-09 — Required fields

A completed Passport save must contain non-empty canonical values for:

- `goal`
- `concern`
- `quiz_version`

Whitespace-only required values are rejected.

### B1-10 — Supported quiz version

The B1 write path accepts only a supported Passport/quiz contract version.

An unknown version is rejected rather than silently stored.

### B1-11 — Canonical optional values

Optional scalar fields normalize empty strings to `null`.

`avoidance_preferences` must be a JSON object matching the approved shape; unknown top-level keys are rejected.

Exact controlled answer vocabularies come from the versioned quiz contract; B1 must not invent a second vocabulary.

## 5. Incomplete Passport edge cases

### B1-12 — Open before completion

When no saved Passport exists, the read path returns a domain state equivalent to:

`not_started`

No recommendation calculation is attempted.

### B1-13 — Partial save

B1 does not persist an invalid partial Passport into the current schema because `goal` and `concern` are required columns.

A partial submission is rejected with a domain-level `PASSPORT_INCOMPLETE` result.

The frontend may keep an unsaved draft locally until the required fields are complete.

### B1-14 — Egypt context with incomplete profile

Country/market is not inferred from free-form client input.

For the Phase-1 Egypt scope, a user who has not completed the Passport remains in the incomplete/not-started state and is guided to complete it; B1 must not fabricate preferences or country data.

## 6. RLS acceptance

Verify on Restore-Test:

- `beauty_profiles` has RLS enabled;
- customer SELECT policy is own-user only;
- customer INSERT policy binds `user_id` to `auth.uid()`;
- customer UPDATE policy has both ownership `USING` and `WITH CHECK`;
- no anonymous policy grants access.

## 7. Persistence invariants

After a successful save:

- one row per user;
- no duplicate Passport rows;
- no recommendation rows are implicitly created;
- no legacy recommendation rows are touched;
- no product/cart/order rows are modified.

## 8. Regression acceptance

B1 must not change behavior of:

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

A B1 evidence record must include:

1. implementation commit SHA;
2. Restore-Test migration/RPC evidence, if schema changes are required;
3. positive create/read test;
4. update/upsert test;
5. cross-user SELECT negative test;
6. cross-user UPDATE negative test;
7. anonymous negative test;
8. invalid/partial payload test;
9. final row-count/invariant check;
10. explicit statement that Production was not changed.

## 10. B1 PASS gate

B1 may be marked **PASS** only when all B1-01 through B1-14 applicable checks are evidenced.

A source review alone is not sufficient.

Browser E2E remains a later launch/browser gate and cannot be inferred from B1 source/SQL tests.
