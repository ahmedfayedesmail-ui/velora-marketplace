# Velora — Browser Gate Targeted Test Cases
## Routine / Quiz / Catalog Contract — 2026-09-21

**Status:** TEST CASES READY — NOT EXECUTED  
**Browser Gate:** LOCKED  
**Production:** FROZEN

## 1. Critical targeted cases

| ID | Scenario | Preconditions | Expected | Actual | Status |
|---|---|---|---|---|---|
| T-01 | Standard oily profile | v2 Passport | Quiz saves; Routine opens | PENDING | ⏳ |
| T-02 | Standard dry profile | v2 Passport | Quiz saves; Routine opens | PENDING | ⏳ |
| T-03 | Standard combination profile | v2 Passport | Quiz saves; Routine opens | PENDING | ⏳ |
| T-04 | Normal skin profile | v2 Passport | Quiz saves; Routine opens | PENDING | ⏳ |
| T-05 | Unknown skin type | v2 Passport | Explicit unknown accepted; Routine handles it | PENDING | ⏳ |
| T-06 | Sensitive skin profile | Quiz exposes Sensitive | Save must succeed; Routine must retain sensitive state | PENDING | BLOCKED BY CURRENT RPC CONTRACT |
| T-07 | Budget under 500 | approved catalog fixture | Routine total ≤ 500 when complete | PENDING | ⏳ |
| T-08 | Budget 500–1000 | approved catalog fixture | Routine total ≤ 1000 | PENDING | ⏳ |
| T-09 | Budget 1000–2000 | approved catalog fixture | Routine total ≤ 2000 | PENDING | ⏳ |
| T-10 | Budget over 2000 | approved catalog fixture | No artificial 2000 cap | PENDING | ⏳ |
| T-11 | Goal supported by concerns only | product concerns contains goal | Product must become eligible after concerns fix | PENDING | BLOCKED BY DRAFT ENGINE FIX |
| T-12 | Goal supported by benefits | product benefits contains goal | Product eligible when step-compatible | PENDING | ⏳ |
| T-13 | No match | catalog has no eligible step | `no_matches`, 0 EGP | PENDING | ⏳ |
| T-14 | Partial required step | one required step unavailable | `partial`; no fabricated replacement | PENDING | ⏳ |
| T-15 | Optional step unavailable | optional item absent | optional step omitted | PENDING | ⏳ |
| T-16 | Variant selected | active variant stocked | exact variant/price shown | PENDING | ⏳ |
| T-17 | Product reuse prevention | enough compatible products | one product not reused across steps | PENDING | ⏳ |
| T-18 | Deterministic repeat | same Passport + catalog | same ordered Routine output twice | PENDING | ⏳ |

## 2. Sensitive skin case

### T-06 — Sensitive profile compatibility

Current backend behavior:
`velora_save_beauty_passport_v2` accepts:

`oily / dry / combination / normal / unknown`

Current proposed UI vocabulary includes:

`sensitive`

Observed non-browser verification:
- saving `sensitive` returns `INVALID_SKIN_TYPE`.

Therefore:

**Expected after approved fix**
1. Select Sensitive.
2. Save Quiz.
3. No error.
4. Passport stores `sensitive`.
5. Routine can be generated without silently coercing Sensitive to another skin type.

**Actual today**
`INVALID_SKIN_TYPE`

**Disposition**
Draft migration is ready; apply only after Browser Gate authorization.

---

## 3. Concerns matching case

### T-11 — Concern-only product signal

Controlled fixture:
- product.status = approved;
- product.category = beauty;
- product.currency_code = EGP;
- product is in stock;
- step-compatible subcategory/tag;
- `products.concerns = ["acne"]`;
- omit `acne` from benefits/tags/goal-specific subcategory signal.

Customer:
- goal = `acne`.

Current behavior to verify:
- product may be step-eligible but does not receive primary goal-match credit from `concerns`.

**Target after approved fix**
The engine should count:
`concerns` alongside tags/benefits/subcategory for goal matching.

No new schema is required.

---

## 4. Positive Routine browser cases

These require a dedicated Restore-Test fixture catalog after the Gate opens.

Minimum fixture:
- 2 cleansers;
- 2 treatments/serums;
- 1 moisturizer;
- 1 sunscreen;
- varied skin types;
- varied benefits/concerns;
- at least 3 price bands;
- at least 1 active variant.

For each positive case verify:

### Complete
All required steps selected.

### Partial
At least one required step unavailable.

### No matches
Zero eligible products.

### Budget boundary
A candidate above the current budget is excluded.

### Variant selection
Lowest eligible active in-stock variant is selected according to current deterministic ordering.

### Non-reuse
The same product ID cannot satisfy multiple steps in one routine.

### Determinism
Same profile + same catalog produces the same output ordering.

## 5. Browser assertions

Every targeted case must assert both UI and data-plane consequences.

Example:

**UI**
- Routine status;
- step labels;
- product name;
- variant;
- price;
- explanation.

**Network**
- relevant RPC;
- request/response status;
- no unexplained 4xx/5xx.

**Database correlation**
Only when needed to prove:
- Passport persisted;
- Routine run persisted where expected;
- Cart item added;
- order created.

## 6. Expected contract shapes

### Complete
`beauty-routine.v1` + `status=complete`

### Partial
`beauty-routine.v1` + `status=partial`

### No matches
`beauty-routine.v1` + `status=no_matches` + `total_cost=0`

### Incomplete Passport
`PASSPORT_INCOMPLETE` precondition error, not a Routine status.

## 7. Current known failures / deferred fixes

### FIND-RT-001
Current Restore-Test catalog cannot exercise positive selection because its only approved test product has empty Beauty matching metadata.

### FIND-RT-002
v2 profile save does not collect/populate a required `concern` field; engine ranking is currently driven primarily by `goal`, tags, benefits, and subcategory.

### FIND-RT-003
Seller metadata must preserve both customer-facing Beauty metadata and operational step signals.

### FIND-RT-004
Sensitive skin value exists in the proposed UI vocabulary but is rejected by the current v2 Passport save RPC.

### FIND-RT-005
Concern-only goal matching needs the approved matching fix to become a first-class ranking signal.

All five are tracked as pre-browser/spec-stage items. No Production change is authorized.

## 8. Test report template

```
TEST-ID:
Environment:
Commit:
Actor:
Preconditions:
Steps:
Expected:
Observed:
Console:
Network:
DB correlation:
Screenshot:
Lifecycle:
Failure ID:
```

