# Velora — Seller Editor Beauty Metadata Specification
## 2026-09-21

**Status:** IMPLEMENTATION SPEC ONLY  
**Production:** FROZEN  
**Browser Gate:** LOCKED  
**Runtime/source changes:** NOT AUTHORIZED

## 1. Current-schema finding

The canonical `public.products` table already contains the requested Beauty fields:

- `skin_types jsonb NOT NULL DEFAULT []`
- `concerns jsonb NOT NULL DEFAULT []`
- `ingredients jsonb NOT NULL DEFAULT []`
- `benefits jsonb NOT NULL DEFAULT []`
- `how_to_use text NULL`
- `warnings text NULL`

Therefore this workstream does **not** propose duplicate columns.

The current C4 gap is capture/validation: Seller Editor does not reliably collect structured Beauty metadata, while the Routine Engine already reads catalog metadata.

## 2. Canonical product metadata contract

### `skin_types`
JSON array of canonical tokens.

Proposed catalog vocabulary:
- `oily`
- `dry`
- `combination`
- `normal`
- `sensitive`
- `unknown`

Rules:
- 0–6 unique values.
- Lowercase snake_case.
- No blank values.
- `unknown` should not be combined with another skin type in approved catalog data.
- **Compatibility note:** the current `velora_save_beauty_passport_v2` RPC accepts `oily, dry, combination, normal, unknown` and rejects `sensitive`. Seller metadata may capture `sensitive`, but it is not currently matchable from the v2 customer profile. This is a contract gap, not a reason to silently remove the catalog value.

### `concerns`
JSON array of controlled consumer-need tokens.

Initial vocabulary:
- `acne`
- `hydration`
- `hyperpigmentation`
- `radiance`
- `daily_care`
- `sensitivity`
- `oil_control`
- `barrier_support`

Rules:
- 0–8 unique values.
- Lowercase snake_case.
- No blank values.

**Engine boundary:** current v2 Routine ranking uses the required customer `goal` directly against product `tags`, `benefits`, and `subcategory`. `products.concerns` is currently useful catalog metadata but is not the primary v2 goal signal.

### `ingredients`
JSON array of normalized ingredient strings.

Rules:
- 0–40 unique entries.
- Preserve supplier/INCI text rather than forcing a closed vocabulary.
- Normalize trim/case for matching storage, but do not invent ingredient synonyms.
- No diagnosis/claim language in the ingredient field.
- Exact ingredient names should be preferred where available.

### `benefits`
JSON array of controlled product-benefit / operational signals.

Initial vocabulary:
- `hydration`
- `acne`
- `hyperpigmentation`
- `radiance`
- `daily_care`
- `cleansing`
- `moisturize`
- `sun_protection`
- `brightening`
- `barrier_support`
- `oil_control`
- `soothing`
- `anti_aging`
- `exfoliation`

Rules:
- 0–12 unique values.
- Lowercase snake_case.
- Benefits describe product positioning/use, not medical diagnosis.

### `how_to_use`
Free text.

Rules:
- Optional for draft products.
- Maximum 2,000 characters.
- Should contain application/use frequency where the seller has verified product instructions.
- No invented medical treatment instructions.

### `warnings`
Free text.

Rules:
- Optional for draft products.
- Maximum 2,000 characters.
- Seller-provided / label-supported precautions only.
- No fabricated contraindications.

## 3. Existing `tags` boundary

The existing `products.tags` field remains part of the current matcher boundary and should become controlled for Beauty products later.

Operational tokens already recognized by the current Routine step matcher include:
- cleanse / cleansing
- treat / treatment
- serum
- active
- exfoliant
- acne_treatment
- anti_aging
- retinol
- vitamin_c
- moisturize / moisturizer
- cream / face_cream / hydrating_cream / lotion
- protect / sunscreen / spf
- sun_protection / uv_protection / sunblock

Do not silently replace these tokens with UI-only labels.

## 4. Seller Editor mock UI structure

Product Editor should be grouped as:

### A. Basic Product
- Product name
- Brand
- Category
- Subcategory
- Price
- Stock
- Main image / images
- Description

### B. Beauty Matching
- Skin types — multi-select chips
- Customer concerns — multi-select chips
- Benefits — multi-select chips
- Product type / operational tags — controlled chips
- Ingredients — repeatable ingredient input

### C. Usage & Safety
- How to use — textarea
- Warnings — textarea

### D. Metadata quality preview
Read-only preview:
- Matchable: skin types / benefits / operational step signal
- Missing: any structured field still empty
- Routine-ready: Yes/No
- Reason: explicit missing-field list

The preview must not claim that a product is medically suitable for a user.

## 5. Validation flow

Draft save:
- allow incomplete metadata;
- normalize tokens;
- reject malformed JSON array values;
- reject blank/overlong entries.

Submit for catalog review:
- Beauty product must have category = `beauty`;
- skin type metadata should be explicitly reviewed;
- benefit / step signal must be present;
- warnings/how-to-use remain optional only when not applicable and must be consciously marked.

Approval:
- approved catalog data must pass the database contract draft;
- seller cannot bypass approval state through client-side fields.

## 6. Expected behavior for the Routine Engine

A Beauty product is useful to the current matcher only when its canonical data can satisfy all of the following:
- approved status;
- EGP currency;
- Beauty category;
- positive stock or available active variant;
- step-compatible subcategory/tag/benefit;
- budget fit.

The seller editor therefore has two jobs:
1. collect truthful product facts;
2. expose the structured signals the current engine can actually consume.

## 7. No-application boundary

This specification does not:
- alter `public.products`;
- add migrations to `supabase/migrations`;
- modify Seller Editor source;
- modify Routine Engine source;
- change Production.

The executable database draft is kept separately as `.sql.draft` under `docs/` until Browser Gate is opened.
