# Velora — Sprint 1 Phase B
## B1 Beauty Passport Persistence — Evidence — 2026-09-20

**Branch:** `sprint-2-s2d-admin`  
**Target:** Restore-Test (`arlaxqmhtvjwjbjinjfw`)  
**Production:** **FROZEN**  
**Status:** **PASS — Restore-Test/source gate**  
**Browser:** Not required for engineering PASS; remains a later browser gate.

## 1. Source Investigation

The active app loads:

- `src/scripts/00-localization.js` — creates `window.mahaSupabase` and exposes `window.supabaseClient`
- `src/index.html` — sequentially loads the application scripts
- `src/scripts/58-s1-b1-beauty-passport.js` — isolated B1 application module

The B1 module exposes:

- `window.veloraBeautyPassport.get()`
- `window.veloraBeautyPassport.save()`

Read path:

`auth.getUser() → beauty_profiles SELECT → RLS-owned row`

Save path:

`normalize payload → velora_save_beauty_profile RPC`

The RPC derives `auth.uid()` server-side and does not accept a client owner UUID.

## 2. Database Implementation

Migration:

`20260920200702 / s1_b1_beauty_passport_save_rpc`

Repository artifact:

`supabase/migrations/20260920235000_s1_b1_beauty_passport_save_rpc.sql`

Implementation properties:

- `SECURITY INVOKER`
- server-derived `auth.uid()`
- `quiz_version = beauty-quiz.v1`
- required `goal` + `concern`
- optional empty scalar values normalized to `NULL`
- `avoidance_preferences` must be an object
- approved top-level avoidance keys: `ingredients`, `tags`
- avoidance values must be arrays of strings
- `updated_at` is server-generated on insert and update
- conflict target is the single `user_id` primary key
- anonymous EXECUTE explicitly revoked
- authenticated EXECUTE explicitly granted

## 3. Acceptance Results

| Check | Result | Evidence |
|---|---|---|
| B1-01 Create | PASS | Valid Passport save returned authenticated owner's UUID |
| B1-02 Read | PASS | Source path reads `beauty_profiles` for authenticated user; Restore-Test RLS read verified |
| B1-03 Update / Upsert | PASS | Repeated save leaves exactly one row and updates fields |
| B1-04 Round-trip | PASS | Final persisted values matched second save; optional empty field became NULL |
| B1-05 Cross-user SELECT | PASS | Customer B saw 0 rows for Customer A |
| B1-06 Cross-user UPDATE | PASS | Customer B affected 0 rows; owner value remained unchanged |
| B1-07 Anonymous access | PASS | Anonymous table read rejected; anonymous RPC rejected |
| B1-08 Owner UUID non-authoritative | PASS | Save RPC has no `user_id` argument and derives `auth.uid()` |
| B1-09 Required fields | PASS | Blank/whitespace goal rejected as `PASSPORT_INCOMPLETE` |
| B1-10 Supported quiz version | PASS | Unknown version rejected as `UNSUPPORTED_QUIZ_VERSION` |
| B1-11 Optional/avoidance validation | PASS | Empty optionals normalize to NULL; unknown avoidance key rejected |
| B1-12 No Passport | PASS | Read module maps missing row to `not_started`; no calculation is invoked |
| B1-13 Partial payload | PASS | Required-field validation rejects incomplete save |
| B1-14 Egypt + incomplete | PASS | Save API accepts no client country override; incomplete state remains explicit |

## 4. Positive Round-trip Test

Transaction-scoped customer test used:

1. save valid Passport;
2. save changed Passport for same user;
3. read the persisted row;
4. assert one row;
5. assert changed concern persisted;
6. assert empty texture normalized to NULL;
7. assert avoidance lists normalized/deduplicated/sorted;
8. assert server timestamp exists;
9. rollback.

Observed:

`visible_rows = 1`  
`goal = hydration`  
`concern = barrier`  
`texture_is_null = true`  
`shopping_priority = value`  
`updated_at_present = true`

## 5. Cross-user Security Test

Customer A created a transaction-scoped Passport.

Customer B then attempted:

- SELECT of Customer A's row
- UPDATE of Customer A's row

Observed:

`cross_user_select_count = 0`  
`cross_user_update_count = 0`

Owner integrity check after the attempted update:

`owner_row_count = 1`  
`owner_goal = hydration`

Transaction was rolled back.

## 6. Negative Validation Tests

All returned expected rejection:

- unsupported quiz version → `UNSUPPORTED_QUIZ_VERSION`
- incomplete required fields → `PASSPORT_INCOMPLETE`
- unknown avoidance key → `INVALID_AVOIDANCE_PREFERENCES`
- anonymous RPC invocation → rejected
- anonymous table read → rejected

## 7. Final Invariants

After all tests:

- `beauty_profiles = 0`
- `beauty_recommendation_runs = 0`
- `beauty_recommendation_items = 0`
- `beauty_feedback = 0`
- legacy `recommendation_runs = 0`
- B1 save RPC is `SECURITY INVOKER`
- `authenticated_execute = true`
- `anon_execute = false`
- `beauty_profiles RLS = enabled`

All test data was transaction-scoped and rolled back.

## 8. Verification Notes

One initial SQL test query had invalid syntax in its test harness; it produced no database mutation and was corrected.

An initial function-ACL inspection exposed explicit anonymous EXECUTE on the new RPC. This was corrected with an explicit:

`REVOKE EXECUTE ... FROM anon`

Final privilege verification confirms anonymous execution is disabled.

These were corrected during verification and are not remaining B1 defects.

## 9. Advisor Result

Security Advisor:

- no B1 save-RPC SECURITY DEFINER finding
- existing Beauty moderation warning remains intentional for `velora_moderate_beauty_feedback`

Performance Advisor:

- Beauty-only findings are INFO `unused_index` notices because the new tables have no runtime workload yet.

No B1-specific advisor blocker remains.

## 10. Regression Boundary

B1 did not create or modify:

- legacy `recommendation_runs`
- Cart
- Checkout
- Orders
- Product Variants
- Reviews
- Wishlist
- Notifications

Final row-count verification confirms recommendation tables remained empty.

## 11. Production Control

**No Production database change, deployment, or provider configuration change was made.**

B1 is **PASS on Restore-Test/source gate**.

Next authorized engineering phase:

**B2 — Canonical Recommendation Operation**
