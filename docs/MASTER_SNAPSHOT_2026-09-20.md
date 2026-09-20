# Velora — Master Snapshot
## Engineering State — 2026-09-20

**Repository:** `ahmedfayedesmail-ui/velora-marketplace`  
**Branch:** `sprint-2-s2d-admin`  
**Current branch HEAD:** updated through Sprint 1 Phase B B5 verification  
**Frontend:** Vanilla JS + static HTML/CSS  
**Backend:** Supabase  
**Vercel Root:** `src`  
**Production:** **FROZEN**

---

## Current Program State

### Sprint 2

- S2-A Variants: engineering scope closed; browser residual retained
- S2-B Wishlist: DB/static regression PASS; browser E2E previously PASS
- S2-C Reviews: DB/static regression PASS; browser E2E previously PASS
- S2-D Admin: implementation/authorization regression PASS; browser residual retained
- S2-E Notifications: DB/static regression PASS; browser E2E previously PASS

### Wave 2.5

**Engineering closeout: CLOSED**  
Final authenticated browser verification remains pending where noted.

Current closeout document:
`docs/SPRINT_2_5_CLOSURE_2026-09-20.md`

---

## Latest Resolved / Remediated Work

### Checkout stale empty state
Root cause was a separate UX44 injection path in `src/scripts/39-payments.js`.

Status:
**SOURCE FIX DEPLOYED**

### Cart mobile clipping
Root cause was an inline two-column Cart layout retaining a fixed 400px summary track.

Status:
**SOURCE FIX DEPLOYED**

### Language exposure
Visible selector is now:
- EN
- AR

Existing localization support for future languages remains in source.

### Desktop layout / screen boundary hardening
Fixed secondary grid tracks now use shrinkable `minmax(0,...)` behavior and page-level content children are constrained to viewport width.

Status:
**SOURCE FIX DEPLOYED — browser verification pending**

### Dark-mode contrast hardening
Customer-facing inputs/selects and native options now inherit dark-theme surfaces/text/borders.

Status:
**SOURCE FIX DEPLOYED — browser verification pending**

### Script manifest
`docs/SCRIPT_MANIFEST.json` synchronized with the active script set, including `57-s2-checkout-e2e.js`.

---

## Current Findings

| Finding | Status |
|---|---|
| F-001 Search | CLOSED |
| F-002 Mobile | CLOSED |
| FIND-BE-026 | RESOLVED |
| F-003 Desktop Scroll | Source fix deployed; browser verification pending |
| F-004 Screen Consistency | Source fix deployed; browser verification pending |
| FIND-BE-020 Dark Mode | Source fix deployed; browser verification pending |
| FIND-BE-023 Console Errors | OPEN; source audit complete, browser correlation required |
| FIND-BE-015 Checkout submit/order creation | OPEN; authenticated browser gate |
| F-008 Currency | TEMPORARY; EGP-first Phase 1 model |
| FIND-BE-008 Variant UI | DEFERRED |
| FIND-BE-027 GDPR Deletion Flow | OPEN; required before Production GO |
| FIND-BE-028 Legacy Recommendation Model Overlap | OPEN; architectural boundary documented |

---

## Beauty Phase 1 Architecture

Primary architecture reference:
`docs/ARCHITECTURE_DOC_PHASE_2.md`

Locked Phase 1 product constraints:
- Egypt only
- Beauty-first
- Arabic + English exposed
- EGP-first
- Beauty Passport
- rules-based recommendations
- frictionless shopping
- explicit feedback loop
- future multi-vertical adjacency
- commission revenue model
- future subscriptions/advertising

---

## Sprint 1 Beauty MVP

Implementation plan:
`docs/SPRINT_1_BEAUTY_MVP_PLAN.md`

Core components:
1. Beauty Quiz
2. Beauty Passport
3. Rules-based Recommendation Engine
4. Recommendation Explanations
5. Feedback Loop
6. Beauty-ready Variants
7. Mobile-first UI

Primary product direction:
**Beauty Passport = Routine Discovery**

Approved customer-facing direction:
- CTA: **اعرفي روتينك**
- Output: **روتينك**
- Primary action: **اطلبي الروتين كله**
- Minimum discovery path: three consumer-language questions
- No unverified “30 seconds” marketing claim; timing is an internal target only

Current Phase-C architectural gap:
`docs/FIND-BE-029_VISION_VS_DATA_CONTRACT_GAP_2026-09-20.md`

Mandatory review gate:
Owner reviews the Phase-C Routine model before any Routine implementation begins.


---

## FIND-BE-023 Source Audit

Recorded in `docs/FIND_BE_023_SOURCE_AUDIT_2026-09-20.md`. Restore-Test function privileges do not support a generic missing-EXECUTE explanation for the reported 401s. No speculative suppression or listener removal was applied.

---

## Sprint 1 Phase A — Data Contract + RLS

- Four Beauty tables implemented on Restore-Test: `beauty_profiles`, `beauty_recommendation_runs`, `beauty_recommendation_items`, `beauty_feedback`
- Existing legacy `recommendation_runs` preserved unchanged
- Positive/negative RLS tests completed
- Staff-only feedback moderation path verified
- Evidence: `docs/SPRINT_1_PHASE_A_EVIDENCE_2026-09-20.md`
- Rate-limit/cache enforcement remains Phase B; not marked implemented

---

## Sprint 1 Phase B — Design Gates + B1

Phase B sequence:
`docs/SPRINT_1_PHASE_B_ENGINEERING_SEQUENCE_2026-09-20.md`

The following contracts were frozen before implementation:

1. `docs/SPRINT_1_PHASE_B_OUTPUT_CONTRACT_2026-09-20.md`
2. `docs/SPRINT_1_PHASE_B_FINGERPRINT_SPEC_2026-09-20.md`
3. `docs/SPRINT_1_PHASE_B_CATALOG_REVISION_SPEC_2026-09-20.md`
4. `docs/SPRINT_1_PHASE_B_B1_ACCEPTANCE_CRITERIA_2026-09-20.md`

Product direction ADR:
`docs/ADR_BEAUTY_PASSPORT_ROUTINE_DISCOVERY_2026-09-20.md`


Locked engineering decisions:
- fingerprint includes `beauty-passport.v1` schema version and canonical Passport inputs;
- budget is not fingerprinted because it is not currently a persisted Passport field;
- fingerprint is server-derived SHA-256 over canonical UTF-8 JSON;
- catalog revision is a server-side monotonic counter for the EG/EGP recommendation catalog;
- price and purchaseability/stock changes invalidate cached recommendations;
- cache identity is `user_id + input_fingerprint + ruleset_version + catalog_revision`;
- cache hits do not consume the new-calculation quota;
- incomplete Passport returns a domain incomplete state and is not used for recommendation calculation;
- no-match is a valid empty-result domain state;
- B1 is persistence only; B2 owns recommendation calculation, cache, rate limit, and output persistence.

### B1 — VERIFIED

Evidence:
`docs/SPRINT_1_PHASE_B_B1_EVIDENCE_2026-09-20.md`

Implementation:
- `supabase/migrations/20260920200702_s1_b1_beauty_passport_save_rpc.sql`
- `src/scripts/58-s1-b1-beauty-passport.js`
- `src/index.html`
- `docs/SCRIPT_MANIFEST.json`

Restore-Test migration:
`20260920200702 / s1_b1_beauty_passport_save_rpc`

Verified:
- create/read/update round-trip
- one Passport row per user
- cross-user SELECT blocked
- cross-user UPDATE blocked
- anonymous table/RPC access blocked
- supported quiz version enforced
- incomplete payload rejected
- avoidance shape validated
- save RPC is SECURITY INVOKER
- authenticated EXECUTE enabled; anon EXECUTE disabled
- all Beauty and legacy recommendation test tables empty after rollback

### B2 — VERIFIED

Evidence:
`docs/SPRINT_1_PHASE_B_B2_EVIDENCE_2026-09-20.md`

Ruleset:
`docs/SPRINT_1_PHASE_B_B2_RULESET_V1_2026-09-20.md`

Implemented:
- canonical authenticated Beauty recommendation operation
- server-side SHA-256 Passport fingerprint
- `CATALOG_V1:EG-EGP:<revision>` catalog revision
- 24h cache reuse
- 5 new calculations / 10 minutes server-side rate limit
- no-match without creating empty recommendation runs
- 18 deterministic rules
- canonical product + variant output
- legacy recommendation boundary preserved
- private internal helpers with restricted ACL

Restore-Test migrations:
- `20260920201146 / s1_b2_beauty_recommendation_operation`
- `20260920201409 / s1_b2_digest_schema_fix`
- `20260920201437 / s1_b2_recommendation_operation_runtime_fix`
- `20260920201535 / s1_b2_private_helper_acl_hardening`
- `20260920201605 / s1_b2_private_helper_search_path_and_rate_pk`

Runtime evidence:
- incomplete state returned correctly
- 5 new calculations succeeded
- identical request reused the same run with `from_cache=true`
- sixth new calculation returned `rate_limited`
- product price change advanced catalog revision `8 → 9`
- `no_matches` returned with no recommendation run created
- legacy `recommendation_runs` remained untouched

### B5 — VERIFIED

Evidence:
`docs/SPRINT_1_PHASE_B_B5_EVIDENCE_2026-09-20.md`

Read contract:
`docs/SPRINT_1_PHASE_B_B5_READ_CONTRACT_2026-09-20.md`

Implemented:
- authenticated SECURITY INVOKER recommendation-history RPC
- no owner UUID input
- RLS-backed own-history reads
- internal snapshot/fingerprint fields removed from authenticated column privileges
- direct recommendation-run/item writes removed from application roles
- deterministic sanitized read response
- B2 recommendation calculation contract unchanged

Restore-Test migrations:
- `20260920204458 / s1_b5_beauty_recommendation_read_contract`
- `20260920204600 / s1_b5_beauty_recommendation_read_privilege_hardening`

B5 status:
**VERIFIED — Restore-Test/source gate**

Current status:
**B1 VERIFIED + B2 VERIFIED + B5 VERIFIED — B6 regression remains before Phase B close.****

---

## Browser Gate

The final browser gate must still validate:

`Login → Search → Product → Add to Cart → Cart → Checkout → Shipping → Currency → Place Order → My Orders → Seller/Admin visibility`

Plus:
- mobile
- desktop
- dark mode
- EN / AR
- no unintended 400/401 behavior
- no duplicate listener behavior

No browser result should be inferred from source-level fixes or SQL tests.

---

## Production Control

**No Production GO is granted by this snapshot. Restore-Test migrations and design documents are not Production authorization.**

No Production DB migration, data change, provider credential change, or deployment should be executed without explicit Owner authorization.

---

## Owner Decision Matrix

| Area | Owner input needed? |
|---|---|
| Phase 1 Egypt / Beauty / AR+EN / EGP scope | **Already decided** |
| Beauty Passport MVP data contract | Engineer can implement within the documented scope |
| Recommendation rules implementation | **Engineer** |
| UX/component architecture | **Engineer** |
| Responsive/CSS fixes | **Engineer** |
| Dark-mode CSS | **Engineer** |
| Console error investigation | **Engineer**, with security-sensitive escalation if uncovered |
| Commission rate / commercial terms | **Owner/Product** |
| Subscription pricing/package | **Owner/Product** |
| Advertising commercial policy | **Owner/Product** |
| Future vertical priority | **Owner/Product** |
| Production GO | **Owner** |

## No Additional Owner Input Required

The current no-browser work can proceed without additional Owner decisions. The remaining Owner-level decisions are commercial/product-policy items, not blockers for the technical Beauty MVP foundation.
