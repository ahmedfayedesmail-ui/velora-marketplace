# Velora — Routine → Cart Integration Evidence
## 2026-09-21

**Scope:** Sprint 1 Routine → Cart integration  
**Branch:** `sprint-2-s2d-admin`  
**Environment:** Restore-Test + source-level verification  
**Production:** **FROZEN**  
**Browser:** **PENDING — no Browser PASS inferred**

## 1. Contract Boundary

The integration preserves the approved boundary:

`Routine = what to buy`  
`Cart = what to collect`  
`Checkout = final stock + price authority`

The adapter does not change the Routine RPC/contract and does not call Checkout or Order Creation.

## 2. Source Changes

### Routine UX

`src/scripts/60-s1-c-routine-ux.js`

Changed:
- activated the existing `اطلبي الروتين كله / Order the whole routine` CTA;
- assigned stable id `veloraRoutineAddAll`;
- retained the same customer-safe Routine rendering;
- exposed the latest rendered `beauty-routine.v1` response to the integration layer via `window.__VELORA_CURRENT_ROUTINE`.

No Routine contract/schema change was made.

### Adapter

`src/scripts/62-s1-c-routine-cart.js`

New dedicated adapter.

Responsibilities:
- authenticate through Supabase Auth;
- read the authenticated user's canonical Cart for de-duplication;
- de-duplicate by exact `product_id + product_variant_id`;
- read the current live product catalog;
- read current active variants;
- add base products through `velora_upsert_cart_item`;
- add variants through `velora_upsert_cart_item_variant`;
- treat current unavailability as skip + explanation;
- handle stock races through the authoritative Cart RPC error codes;
- mark successful additions as already-known server Cart keys within the same routine operation;
- refresh canonical cloud Cart state after processing.

The adapter contains no:
- Checkout RPC;
- Order Creation logic;
- shipping logic;
- commission/subscription/refund logic;
- currency-model refactor.

## 3. Append + De-duplicate

The adapter is append-only.

For each selected Routine step:

1. Build key:
   `product_id::variant_id`
2. Check canonical server Cart.
3. If key exists:
   - do not call an incrementing Cart RPC;
   - classify as **already in Cart**.
4. If absent:
   - call the appropriate Cart writer with quantity 1;
   - add the key to the in-memory set so repeated identical steps in the same Routine are also de-duplicated.

Therefore repeated routine-add actions do not intentionally replace the Cart.

## 4. Available / Unavailable Handling

Current live catalog is checked immediately before the Cart write.

### Base product

Skipped before RPC when:
- product is missing;
- product is not approved;
- active variants now exist while the Routine selected a base product;
- base stock is zero.

The server Cart writer remains authoritative for race conditions:
- `INSUFFICIENT_STOCK` → skip + explain.

### Variant

Skipped before RPC when:
- selected variant is missing/inactive;
- variant stock is zero.

The server variant writer remains authoritative for race conditions:
- `INSUFFICIENT_VARIANT_STOCK` → skip + explain.

Other RPC errors are not silently classified as availability; they are surfaced as integration failures.

## 5. Live Catalog Representation

`src/scripts/00-localization.js` cloud Cart hydration now reads:

- product catalog price;
- active/historical variant metadata associated with a Cart line;
- variant price;
- variant SKU;
- variant attributes;
- variant stock quantity;
- variant active state.

For a variant Cart line, the live variant price is used instead of the base product price.

This preserves the approved price rule:

`Routine price = informational selection`  
`Cart price = current catalog representation`  
`Checkout price = final server authority`

No price snapshot was introduced.

## 6. Script Loading

`src/index.html` loads:

1. Routine UX
2. Quiz v2
3. Routine → Cart adapter

The adapter is loaded exactly once.

## 7. Source Verification

Verified from the committed branch source:

| Check | Result |
|---|---|
| Routine CTA activated | **PASS** |
| Routine payload retained without contract changes | **PASS** |
| Canonical server Cart used for dedup | **PASS** |
| Exact product + variant key | **PASS** |
| Base Cart RPC path | **PASS** |
| Variant Cart RPC path | **PASS** |
| Base stock race handling | **PASS** |
| Variant stock race handling | **PASS** |
| Unavailable items skipped with explanation | **PASS** |
| Cloud Cart refresh after adds | **PASS** |
| Live variant price hydration | **PASS** |
| Checkout/Order Creation untouched by adapter | **PASS** |
| F-008 currency refactor untouched | **PASS** |
| Browser E2E | **PENDING** |

## 8. Browser Gate

This evidence does **not** certify Browser E2E.

Required Browser verification later:

`Login → completed Passport → See my routine → Routine → Order the whole routine → Cart → inspect exact lines/prices → repeat → verify no duplicate lines`

Additional scenarios:
- base item available;
- base item stock changes before add;
- variant item available;
- variant stock changes before add;
- mixed available/unavailable Routine;
- repeated Routine add is idempotent;
- Cart displays current live variant price.

## 9. Status

**Routine → Cart Source Implementation = READY FOR BROWSER VERIFICATION**

Next gate:

**Unified Browser Gate**

Production remains **FROZEN**.
