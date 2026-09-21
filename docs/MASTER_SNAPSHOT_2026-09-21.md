# Velora — Master Snapshot
## Engineering State — 2026-09-21

**Repository:** `ahmedfayedesmail-ui/velora-marketplace`  
**Branch:** `sprint-2-s2d-admin`  
**Current branch state:** updated through Sprint 1 Phase C Routine Output Contract verification + Phase D1/D3 planning  
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

---

## Sprint 1 Beauty MVP

Primary product direction:

**Beauty Passport = Routine Discovery**

Approved customer-facing direction:

- CTA: **اعرفي روتينك**
- Output: **روتينك**
- Primary action: **اطلبي الروتين كله**
- Minimum discovery path: three consumer-language questions
- No unverified “30 seconds” marketing claim

### Phase A

**Foundation = VERIFIED**

Implemented on Restore-Test:

- `beauty_profiles`
- `beauty_recommendation_runs`
- `beauty_recommendation_items`
- `beauty_feedback`

### Phase B

**B1/B2/B3/B4/B5/B6 = VERIFIED / PHASE B CLOSED**

The Phase-B Recommendation contract remains separate:

- `beauty-recommendation.v1`
- Legacy `public.recommendation_runs` remains untouched.

### Phase C

**Owner Review Gate = APPROVED — 2026-09-21**

**Foundation = VERIFIED**

Applied migrations:

- `20260921022410 / phase_c_data_contract_v2_foundation`
- `20260921022602 / phase_c_routine_acl_hardening`

Foundation verification confirmed:

- Passport v2 fields `skin_type` and `routine_budget`;
- Routine runs/steps tables;
- RLS ownership;
- client read-only ACL;
- approved FK delete behavior;
- cross-user joins blocked;
- B1/B2 script loading remains single-instance.

### Phase C — Rules Engine v2

**IMPLEMENTATION = VERIFIED — Restore-Test**

Applied implementation/hardening migrations:

- `20260921023715 / phase_c_rules_engine_v2`
- `20260921023756 / phase_c_rules_engine_v2_reason_evidence_fix`
- `20260921023826 / phase_c_rules_engine_v2_digest_search_path_fix`
- `20260921024038 / phase_c_rules_engine_v2_deterministic_selection`
- `20260921024132 / phase_c_rules_engine_v2_helper_search_path_hardening`

Verified behavior:

- deterministic-first selection;
- ordered Routine steps with AM/PM tags;
- repetition limits 2/2/2/1;
- catalog-driven eligibility;
- active/in-stock variant selection;
- no product reuse across Routine steps;
- budget cap honored;
- required unavailable step → `partial`;
- zero selected products → `no_matches`;
- structured reason codes;
- internal fingerprint not exposed;
- anonymous RPC execution denied;
- clean transaction-scoped verification.

Evidence:

`docs/PHASE_C_RULES_ENGINE_V2_EVIDENCE_2026-09-21.md`

### Phase C — Quiz v2 RPC

**IMPLEMENTATION = VERIFIED — Restore-Test**

Applied migration:

- `20260921024810 / phase_c_quiz_v2_save_rpc`

RPC contract:

- `public.velora_save_beauty_passport_v2(text, text, text)`
- `SECURITY INVOKER`
- server-derived `auth.uid()`
- no client owner UUID argument
- required `skin_type` and `routine_budget` for `beauty-quiz.v2`
- v2 save updates `quiz_version`, `goal`, `skin_type`, `routine_budget`, `updated_at`
- existing optional legacy fields are preserved on v2 core save
- anonymous EXECUTE denied; authenticated EXECUTE granted
- `updated_at` server generated

Backward compatibility:

- existing `beauty-quiz.v1` rows remain valid;
- no automatic/bulk upgrade;
- first successful v2 save is the user-level transition point;
- legacy `concern` is nullable so the approved three-question minimum does not fabricate a value.

Verification:

- v1 row accepted before upgrade;
- v2 upgrade persisted correctly;
- existing concern preserved;
- cross-user visibility blocked;
- separate user save isolated;
- invalid skin type rejected;
- invalid budget rejected;
- anonymous invocation denied;
- notification count unchanged in test session;
- all test data rolled back.

Evidence:

`docs/PHASE_C_QUIZ_V2_RPC_EVIDENCE_2026-09-21.md`

### Current Phase-C Boundary

`selection_status = not_needed` remains a supported schema state but is not emitted by the current template; optional absent candidates are currently omitted.

The final customer-facing one-line explanation is deferred to the Routine UX mapping layer.

### Phase C — Routine Output Contract v1

**IMPLEMENTATION = VERIFIED — Restore-Test**

Contract:

- `beauty-routine.v1`
- successful statuses: `complete | partial | no_matches`
- ordered `steps[]` with step/order/type/time/selection/product/variant/reason codes;
- `total_cost` + `currency`;
- no client input fingerprint;
- no catalog revision, ruleset version, or internal run object.

Precondition:

- incomplete Passport is rejected as `PASSPORT_INCOMPLETE` rather than represented as a Routine status.

Verification covered complete, partial, and no-match responses plus ACL and clean-state checks.

Evidence:

`docs/PHASE_C_ROUTINE_OUTPUT_CONTRACT_V1_EVIDENCE_2026-09-21.md`

Quiz v2 frontend UI is not part of this gate yet.

---

## Phase D — Operations / Trust / Economics

**Strategy = APPROVED — planning started in parallel**

Confirmed:

- separate Phase D;
- MVP fulfillment model = Curated Sellers;
- split shipment is an explicit transparent UX concept;
- shipping adapter pattern;
- Legal/Trust planning in parallel;
- no dermatologist dependency in MVP;
- authenticity is separate from seller KYC;
- Unit Economics is a shared framework;
- critique market/unit-economics numbers remain assumptions until validated;
- Routine ≠ Order.

Planning outputs:

- `docs/PHASE_D1_SELLER_OPERATIONS_PLANNING_2026-09-21.md`
- `docs/PHASE_D3_LEGAL_TRUST_FRAMEWORK_PLANNING_2026-09-21.md`

No Phase-D commercial policy is encoded in the Routine engine.

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
| FIND-BE-029 Vision vs Data Contract Gap | IMPLEMENTED THROUGH PHASE C DATA CONTRACT + RULES ENGINE + QUIZ V2 RPC + ROUTINE OUTPUT CONTRACT; continue through Routine UX |

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
- Beauty Passport → Routine discovery browser path

No browser result should be inferred from source-level fixes or SQL tests.

---

## Production Control

**No Production GO is granted by this snapshot.**

Restore-Test migrations, source artifacts, and verification evidence are not Production authorization.

No Production DB migration, data change, provider credential change, or deployment should be executed without explicit Owner authorization.

---

## Owner Decision Matrix

| Area | Owner input needed? |
|---|---|
| Phase 1 Egypt / Beauty / AR+EN / EGP scope | **Already decided** |
| Beauty Passport / Routine data contract | **Already approved** |
| Recommendation / Rules Engine implementation | **Engineer** within approved scope |
| Quiz / Routine UI architecture | **Engineer** within approved scope |
| Responsive/CSS fixes | **Engineer** |
| Dark-mode CSS | **Engineer** |
| Console error investigation | **Engineer**, with security-sensitive escalation if uncovered |
| Commission rate / commercial terms | **Owner/Product** |
| Subscription pricing/package | **Owner/Product** |
| Advertising commercial policy | **Owner/Product** |
| Future vertical priority | **Owner/Product** |
| Fulfillment model | **Already decided — Curated Sellers** |
| Commission rate / commercial terms | **Owner/Product** |
| Subscription pricing/package | **Owner/Product** |
| Seller commercial terms | **Owner/Product** |
| Refund economics | **Owner/Product** |
| Production GO | **Owner** |

---

## Next Engineering Sequence

**Routine Verification → Routine UX → Sprint 1 UI**

In parallel: **D1 Seller Operations Planning → D3 Legal/Trust Planning → D2/D4 planning gates**

Production remains **FROZEN**.
