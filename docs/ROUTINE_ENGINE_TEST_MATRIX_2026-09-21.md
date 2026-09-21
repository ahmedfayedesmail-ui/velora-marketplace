# Velora — Routine Engine Test Matrix
## 2026-09-21

**Environment:** Restore-Test `arlaxqmhtvjwjbjinjfw`  
**Production:** NOT TOUCHED  
**Data changes:** temporary transaction fixtures only; rolled back  
**Browser:** not involved

## 1. Test contract

Current v2 engine input is:
- `skin_type`
- `goal`
- `routine_budget`

The v2 customer save RPC does not require/populate `beauty_profiles.concern`.

Therefore this matrix uses **goal as the current engine's consumer-need/concern proxy** and explicitly records that contract mismatch.

## 2. Current catalog state used for the observed run

Restore-Test has one approved test product:
- `Test Vitamin C Serum`
- price: 250 EGP
- stock: 23
- `skin_types = []`
- `concerns = []`
- `ingredients = []`
- `benefits = []`
- `tags = []`

Because the Routine Engine requires step-compatible canonical catalog data, this catalog cannot satisfy the required routine steps.

## 3. Scenario matrix

| ID | Profile | Expected against current catalog | Actual | Result |
|---|---|---|---|---|
| S01 | oily + acne + under_500 | no_matches | no_matches | PASS |
| S02 | dry + hydration + under_500 | no_matches | no_matches | PASS |
| S03 | combination + hyperpigmentation + 500_1000 | no_matches | no_matches | PASS |
| S04 | normal + radiance + 500_1000 | no_matches | no_matches | PASS |
| S05 | unknown + daily_care + 1000_2000 | no_matches | no_matches | PASS |
| S06 | oily + hydration + unknown | no_matches | no_matches | PASS |
| S07 | dry + acne + under_500 | no_matches | no_matches | PASS |
| S08 | combination + daily_care + under_500 | no_matches | no_matches | PASS |
| S09 | normal + hyperpigmentation + over_2000 | no_matches | no_matches | PASS |
| S10 | unknown + acne + 500_1000 | no_matches | no_matches | PASS |
| S11 | oily + radiance + under_500 | no_matches | no_matches | PASS |
| S12 | dry + daily_care + 500_1000 | no_matches | no_matches | PASS |

The observed outputs were identical contract-safe JSON responses:
```json
{
  "contract_version": "beauty-routine.v1",
  "status": "no_matches",
  "steps": [],
  "total_cost": 0,
  "currency": "EGP"
}
```

## 4. Input compatibility failure observed

### E01 — Sensitive skin mismatch
Attempting:
`skin_type = sensitive`

Result:
`INVALID_SKIN_TYPE`

Cause:
`velora_save_beauty_passport_v2` currently accepts:
- oily
- dry
- combination
- normal
- unknown

It does not accept `sensitive`.

Impact:
- the proposed MVP question vocabulary includes Sensitive;
- the backend v2 passport contract does not currently accept it;
- Seller catalog may still contain `sensitive` metadata, but current customer matching cannot originate that profile value.

Classification:
**Contract mismatch / pre-browser blocker.**

## 5. Engine/data findings

### FIND-RT-001 — Current catalog cannot exercise positive selection
All 12 valid scenarios return `no_matches` because the only approved product has empty matching metadata and cannot satisfy the step matcher.

This is primarily C2/C4 catalog readiness, not proof of a broken ranking algorithm.

### FIND-RT-002 — `concerns` is not the v2 primary matching signal
The current Routine operation ranks `goal_match` from:
- product tags;
- product benefits;
- product subcategory.

The current profile's `concern` is nullable and the v2 save path does not collect it.

Therefore a seller can populate `products.concerns` correctly while seeing no direct v2 ranking effect from that field.

### FIND-RT-003 — Seller metadata must carry operational step signals
Step matching is subcategory/tag/benefit driven:
- cleanse;
- treat;
- moisturize;
- protect.

Beauty metadata must therefore preserve both customer-facing benefits and the existing operational tag/subcategory vocabulary.

## 6. Required next test after Gate opens

Seed only a dedicated non-production fixture catalog containing at least:
- 2 cleansers;
- 2 treatments/serums;
- 1 moisturizer;
- 1 sunscreen;
- varied skin types;
- varied goal/benefit tags;
- at least 3 price bands.

Then rerun:
- complete routine;
- partial routine;
- no matches;
- budget boundary;
- variant selection;
- product non-reuse;
- deterministic repeat.

Expected positive-pass oracle:
- `complete` when every required step has an eligible product;
- `partial` when one or more required steps have no eligible product;
- `no_matches` when zero products can be selected;
- total_cost equals selected product/variant prices only.

## 7. Guardrail

The current 12/12 `no_matches` result must not be presented as “the engine works with real catalog data.” It proves only that the current engine safely reports no matches against the current Restore-Test catalog.

