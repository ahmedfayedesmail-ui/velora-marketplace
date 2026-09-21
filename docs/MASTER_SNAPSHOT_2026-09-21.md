# Velora — Master Snapshot
## Engineering State — 2026-09-21

**Repository:** `ahmedfayedesmail-ui/velora-marketplace`  
**Branch:** `sprint-2-s2d-admin`  
**Current branch state:** updated through Phase C Routine Verification + Routine/Quiz UX source implementation + Cart hardening + Phase D1/D2/D3/D4 planning  
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

### Phase C — Routine Verification

**VERIFICATION = CLOSED — Restore-Test**

Verified:

- complete / partial / no_matches;
- deterministic repeat;
- all four budget bands;
- variant selection;
- required unavailable → partial;
- optional unavailable → omitted;
- no product reuse;
- reason-code evidence;
- no internal metadata leakage;
- RLS / cross-user isolation;
- clean rollback.

A real step-eligibility bug was found during verification and fixed before closure:

- generic `brightening` metadata no longer turns a moisturizer into a Treat candidate;
- step matcher remains step-specific.

Evidence:

`docs/PHASE_C_ROUTINE_VERIFICATION_EVIDENCE_2026-09-21.md`

Migration:

`20260921033114 / phase_c_routine_step_match_hardening`

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

### Phase C — Routine UX

**SOURCE IMPLEMENTATION = READY FOR BROWSER VERIFICATION**

Added:

- `src/scripts/60-s1-c-routine-ux.js`

Behavior:

- calls `public.velora_generate_beauty_routine()`;
- consumes only the `beauty-routine.v1` customer-safe contract;
- renders AM/PM sections;
- renders product + variant;
- renders deterministic reason-based one-line explanation;
- renders total cost / currency;
- renders `partial` without fabricated replacement;
- omits absent optional steps;
- handles `no_matches`;
- does not expose internal routine metadata;
- remains independent from Quiz v2 persistence and Commerce integration.

The home hero receives a **Build my routine / اعرفي روتينك** entry point.

Browser verification is still required; no Browser PASS is inferred from source implementation.

Quiz v2 frontend source is now implemented separately in `src/scripts/61-s1-c-quiz-v2.js`.

Returning-user behavior is state-aware: v2-complete Passport shows **شوفي روتينك / See my routine** and opens Routine directly; otherwise **اعرفي روتينك / Build my routine** opens Quiz v2. `unknown` remains a valid complete value, and the state is re-checked at click time. Routine UI also exposes **عدّلي إجاباتك / Edit my answers** to return to Quiz v2.

- three-question customer path;
- `beauty-quiz.v2`;
- `skin_type / goal / routine_budget`;
- AR/EN copy;
- explicit `unknown` handling for skin type and budget;
- save through `velora_save_beauty_passport_v2`;
- handoff to Routine UX only after successful v2 save;
- no commerce/check-out logic;
- legacy v1 module remains intact.

Evidence:
`docs/PHASE_C_QUIZ_V2_UI_SOURCE_EVIDENCE_2026-09-21.md`

Quiz v2 UI Browser Verification remains pending.

---

## Phase D — Operations / Trust / Economics

**Strategy = APPROVED — planning in parallel**

Confirmed:

- separate Phase D;
- MVP fulfillment model = Curated Sellers;
- split shipment is an explicit transparent UX concept;
- shipping adapter pattern;
- no carrier commercial selection yet;
- Legal/Trust planning in parallel;
- no dermatologist dependency in MVP;
- authenticity is separate from seller KYC;
- Unit Economics is a shared framework;
- critique market/unit-economics numbers remain assumptions until validated;
- Routine ≠ Order.

### D1 Seller Operations

Planning ready:

`docs/PHASE_D1_SELLER_OPERATIONS_PLANNING_2026-09-21.md`

### D2 Fulfillment

Planning ready:

`docs/PHASE_D2_FULFILLMENT_PLANNING_2026-09-21.md`

Approved MVP model:

- Curated Sellers;
- split shipments transparent;
- shipping adapter abstraction;
- carrier-neutral until commercial selection;
- seller/store fulfillment unit concept;
- existing `order_items` + `shipments` + `shipment_items` primitives retained.

### D3 Legal / Trust

Planning ready:

`docs/PHASE_D3_LEGAL_TRUST_FRAMEWORK_PLANNING_2026-09-21.md`

### D4 Unit Economics

Planning ready:

`docs/PHASE_D4_UNIT_ECONOMICS_PLANNING_2026-09-21.md`

Framework-only; Owner/Product inputs remain separate from engineering mechanics.

No Phase-D commercial policy is encoded in the Routine engine.

---

### Cart Hardening — FIND-BE-030

**BASE CART STOCK GUARD = VERIFIED — Restore-Test**

Finding:
`FIND-BE-030 — Base Cart Stock Guard gap`

Implemented:

- base product row locking with `FOR UPDATE`;
- existing Cart quantity normalized to zero when absent;
- `existing + requested <= stock` enforcement;
- `INSUFFICIENT_STOCK` on over-capacity;
- atomic requested increment behavior;
- no inventory decrement at Cart Add.

A verification harness exposed and corrected a NULL-on-empty-Cart implementation edge case before final verification.

Migrations:

- `20260921120000_cart_base_product_stock_guard`
- `20260921123000_cart_base_product_stock_guard_null_existing_fix`

Evidence:

`docs/FIND-BE-030_BASE_CART_STOCK_GUARD_EVIDENCE_2026-09-21.md`

Production remains frozen; Checkout/FIND-BE-015 remains a separate workstream.

### Security Finding — FIND-BE-031

**Variant Cart writer anon EXECUTE exposure = INVESTIGATED / DEFERRED**

Observed:
- anon EXECUTE is currently granted on the variant Cart writer;
- anonymous invocation returned `AUTH_REQUIRED`;
- no unauthorized Cart mutation was observed.

Decision:
- no security ACL fix in the current Routine → Cart workstream;
- dedicated security decision remains open;
- Production remains frozen.

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
| FIND-BE-029 Vision vs Data Contract Gap | IMPLEMENTED THROUGH PHASE C DATA CONTRACT + RULES ENGINE + QUIZ V2 RPC + ROUTINE OUTPUT CONTRACT + ROUTINE VERIFICATION; continue through Routine UX |\n| FIND-BE-030 Base Cart Stock Guard | RESOLVED / VERIFIED — Restore-Test |\n| FIND-BE-031 Variant cart writer anon EXECUTE exposure | OPEN — investigated / deferred |

---

### Sprint 1 — Routine → Cart Integration

**SOURCE IMPLEMENTATION = READY FOR BROWSER VERIFICATION**

Implemented:

- `src/scripts/62-s1-c-routine-cart.js` dedicated adapter;
- active `اطلبي الروتين كله / Order the whole routine` CTA;
- append-only behavior;
- exact product + variant de-duplication against the canonical server Cart;
- live product/variant availability preflight;
- unavailable-item skip + explanation;
- server-authoritative base/variant stock race handling;
- cloud Cart refresh after add;
- live variant price/metadata hydration in Cart representation.

Boundaries preserved:

- no Routine contract changes;
- no Checkout / Order Creation changes;
- no commercial logic;
- no F-008 currency refactor;
- Production remains frozen.

Evidence:

`docs/SPRINT_1_ROUTINE_CART_INTEGRATION_EVIDENCE_2026-09-21.md`

Browser verification is still pending.

### Unified Browser Gate

**EXECUTION PLAN = READY**

Document:

`docs/UNIFIED_BROWSER_GATE_EXECUTION_PLAN_2026-09-21.md`

Dependency order:

`FIND-BE-023 → Auth/session → Cart → FIND-BE-015 → Orders/Seller/Admin → Routine/Quiz/Returning User → Sprint 2 residuals → presentation regression → FIND-BE-027`

Lifecycle discipline:

**Observed → Fixed → Browser Verified → Closed**

Current agent runtime has no `agent-browser` executable, so no Browser PASS is claimed from this preparation.

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

### Owner Review / Waiting State

**Unified Browser Gate Plan = OWNER PRE-READ**

The technical plan is ready but is **not LOCKED** until Owner review and explicit approval of the execution order.

Companion execution layer:

`docs/UNIFIED_BROWSER_GATE_OWNER_CHECKLIST_2026-09-21.md`

Checklist status:

**DRAFT — Owner Review Required**

### FIND-BE-027 Data Protection Prep

**OPEN / PRE-LAUNCH — PREPARED FOR OWNER/LEGAL REVIEW**

Working title moved from generic “GDPR Deletion Flow” toward:

**Data Protection / Deletion Readiness**

Reason:
- current product direction is Egypt-first;
- Egypt's Personal Data Protection Law No. 151 of 2020 and Executive Regulations No. 816 of 2025 are the primary framework to assess for the current operation;
- GDPR applicability is a separate territorial-scope assessment if Velora intentionally offers goods/services to people in the EU or monitors behavior there.

Preparation document:

`docs/FIND-BE-027_DATA_PROTECTION_DELETION_PREP_2026-09-21.md`

No legal conclusion or Production authorization is implied.

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
| Fulfillment model | **Already decided — Curated Sellers** |
| Commission rate / commercial terms | **Owner/Product** |
| Subscription pricing/package | **Owner/Product** |
| Advertising commercial policy | **Owner/Product** |
| Seller commercial terms | **Owner/Product** |
| Refund economics | **Owner/Product** |
| Future vertical priority | **Owner/Product** |
| Production GO | **Owner** |

---

## Next Engineering Sequence

**Routine UX source ✅ → Quiz v2 UI source ✅ → Cart Guard ✅ → Routine → Cart source ✅ → Unified Browser Gate Owner Pre-Read ✅ → Owner approval ⏭️ → Browser execution ⏭️**

Phase D parallel: **D1 ✅ → D2 ✅ → D3 ✅ → D4 ✅**

Production remains **FROZEN**.
