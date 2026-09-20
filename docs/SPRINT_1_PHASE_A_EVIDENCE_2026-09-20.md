# Velora — Sprint 1 Phase A Evidence
## Data Contract + RLS Verification — 2026-09-20

**Repository:** `ahmedfayedesmail-ui/velora-marketplace`  
**Branch:** `sprint-2-s2d-admin`  
**Target:** Restore-Test (`arlaxqmhtvjwjbjinjfw`)  
**Production:** **FROZEN**

---

## 1. Migration

Phase A DDL was applied successfully to Restore-Test.

Applied migration history entries:

- `s1_phase_a_beauty_foundation`
- `fix_beauty_feedback_staff_rls`
- `consolidate_beauty_feedback_rls`
- `revoke_beauty_moderation_anon`
- `add_beauty_fk_indexes`

Repository migration artifacts are under `supabase/migrations/`.

---

## 2. Important Compatibility Finding

During pre-migration inspection, `public.recommendation_runs` was found to be an existing legacy recommendation-intelligence table and is referenced by existing Velora functions.

It was **not** dropped, altered, or repurposed.

Beauty recommendation history therefore uses:

- `beauty_recommendation_runs`
- `beauty_recommendation_items`

This preserves the existing recommendation/intelligence contract.

---

## 3. Schema Verification

Verified in Restore-Test:

- `beauty_profiles` exists and RLS enabled.
- `beauty_recommendation_runs` exists and RLS enabled.
- `beauty_recommendation_items` exists and RLS enabled.
- `beauty_feedback` exists and RLS enabled.

Constraints verified:

- Beauty profile owner key is the authenticated profile UUID.
- Recommendation run → profile uses CASCADE.
- Recommendation item → run uses CASCADE.
- Beauty feedback → profile uses CASCADE.
- Beauty feedback → order item uses SET NULL.
- Recommendation/feedback product references use RESTRICT.
- Variant references use SET NULL.
- Recommendation position is unique per run and limited to 1–5.
- Recommendation reason_codes cannot be empty.
- Feedback rating is constrained to 1–5.
- Feedback idempotency key is unique per user.
- Purchase feedback must include an order item.
- One feedback record is allowed per order item.
- Required Beauty RLS indexes were added.

---

## 4. Positive RLS Tests

Tested using Restore-Test transaction-scoped auth claims.

### Customer A

Observed:

- Beauty profiles visible: 1
- Beauty recommendation runs visible: 1
- Beauty recommendation items visible: 1
- Beauty feedback visible: 1

### Customer B

Observed:

- Beauty profiles visible: 1
- Beauty recommendation runs visible: 1
- Beauty recommendation items visible: 1
- Beauty feedback visible: 1

Each customer saw only their own test records.

All seeded verification rows were transaction-scoped and rolled back. Final Beauty table row counts are all **0**.

---

## 5. Negative RLS Tests

### Cross-user Beauty Feedback Insert

Customer A attempted to insert a Beauty Feedback row with Customer B's `user_id`.

Result:

**REJECTED — row violates RLS policy**

### Anonymous access

Anonymous role attempted to read Beauty tables.

Result:

**REJECTED — no table privilege**

### Non-staff moderation

Customer role attempted:

`velora_moderate_beauty_feedback(...)`

Result:

**REJECTED — STAFF_REQUIRED**

### Staff moderation

Staff test identity invoked the moderation operation.

Result:

**SUCCESS — moderation status changed through the controlled operation**

---

## 6. Security Advisor

Current Beauty-specific Security Advisor result:

### Accepted / intentional

`public.velora_moderate_beauty_feedback(...)`

- SECURITY DEFINER
- `anon EXECUTE = false`
- `authenticated EXECUTE = true`
- function explicitly checks staff authorization

This produces the standard Supabase warning for authenticated-executable SECURITY DEFINER functions. It is intentional because moderation needs a narrow privileged write path while direct customer UPDATE is not granted.

### Unrelated pre-existing findings

Restore-Test still reports existing project-wide advisor findings, including:

- SECURITY DEFINER functions exposed to public/roles
- `pg_net` in public schema
- existing RLS/no-policy notices on unrelated tables
- leaked-password protection warning
- unused indexes on newly-created Beauty tables (INFO; expected before runtime usage)

No Beauty table is reported as RLS-enabled-without-policy.

---

## 7. Performance Advisor

Beauty-specific remaining INFO findings are currently `unused_index` notices because the new tables have no production workload yet.

The initial unindexed-FK notices were resolved by adding:

- `beauty_feedback_moderated_by_idx`
- `beauty_feedback_product_variant_idx`
- `beauty_recommendation_items_product_variant_idx`

---

## 8. Rate Limiting / 24h Recommendation Cache

Phase A schema now supports the approved caching contract through:

- `ruleset_version`
- `catalog_revision`
- `input_snapshot`
- `input_fingerprint`
- `user_id + created_at` indexes

The actual **24h cache reuse + 5 runs / 10 minutes rate-limit enforcement** remains a Phase B recommendation-operation concern and has not been falsely marked implemented here.

---

## 9. Browser Gate

No browser E2E claim is made by this evidence.

Still pending:

- interactive Beauty Quiz flow
- Passport persistence in the actual UI
- recommendation card rendering
- Add All flow
- checkout continuity
- feedback UI
- final EN/AR/mobile/browser regression

---

## 10. GDPR

Recorded separately:

`FIND-BE-027 — GDPR Deletion Flow`

Status:

**OPEN — required before Production GO**

Cascade behavior is implemented at the DB relationship level, but deletion/retention workflow is not being represented as complete GDPR compliance.

---

## 11. Conclusion

**Phase A Data Contract + RLS = VERIFIED on Restore-Test ✅**

No Production schema/data/configuration was changed.

Production remains **FROZEN**.
