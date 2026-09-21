# Velora — Canonical Catalog Unification Plan
## 2026-09-21

**Status:** IMPLEMENTATION PLAN  
**Production:** FROZEN  
**Browser Gate:** LOCKED

## 1. Decision

Velora must have one authoritative catalog:

> **Canonical Supabase `public.products` + canonical variant path**

The legacy JavaScript product catalog is not a second source to merge with canonical data.

**Strategy: KILL LEGACY CATALOG — DO NOT MERGE.**

## 2. Legacy catalog inventory

### A. Primary legacy definition
`src/scripts/00-localization.js`

Verified on the current branch:
- file size is approximately 534k characters;
- it defines `const PRODUCTS = [`;
- the array is explicitly marked as **50 products**;
- the data is exported through `window.MAHA_DATA = { PRODUCTS, ... }`;
- the same file contains legacy product normalization helpers:
  - `normalizeProduct`
  - `normalizeAllProducts`
  - `getProductById`
  - `getAllProducts`
- the file also carries search/access-layer logic around `MAHA_DATA.PRODUCTS`.

This is the primary legacy catalog source.

### B. Hard-coded catalog-count presentation
`src/index.html`

Verified:
- homepage hero contains `<strong id="statProducts">50+</strong>`.

This is a presentation dependency that must stop implying a static catalog size.

### C. Legacy consumer boundary
Other legacy scripts may call the `MAHA_DATA.PRODUCTS` access layer without owning the catalog definition.

These consumers should be migrated by **read-path**, not by copying their data into a second store.

## 3. Canonical target

Canonical product entity:
- `public.products`
- `public.product_variants`

Canonical eligibility for marketplace/Routine:
- approved product status;
- active seller/store relationship;
- Beauty category when used by Routine;
- EGP for current Phase-1 Routine scope;
- in-stock product or available active variant.

Existing canonical marketplace retrieval already uses the RPC:
`public.velora_get_marketplace_catalog(...)`.

The Routine Engine reads the canonical `products` table directly through its controlled server-side operation.

## 4. Cutover sequence after Browser Gate

### Step 1 — Freeze legacy reads
Add a source-level guard in the engineering task:
- no new feature may read `MAHA_DATA.PRODUCTS`;
- new code must use canonical catalog/RPC paths.

### Step 2 — Inventory consumers
Search every loaded script for:
- `MAHA_DATA.PRODUCTS`
- `getAllProducts()`
- `getProductById()`
- direct iteration over legacy `PRODUCTS`.

Classify each use:
- marketplace listing;
- product detail;
- search;
- featured/deals;
- compare;
- cart bridge;
- analytics/presentation.

### Step 3 — Replace read paths
Each consumer gets a canonical replacement:
- catalog listing → canonical catalog RPC/data path;
- product detail → canonical product lookup;
- search → canonical discovery/search path;
- featured/deals → canonical filters;
- counters → `count(products)` or canonical aggregated result.

No legacy product object is copied into canonical tables.

### Step 4 — Delete the catalog definition
Remove the `PRODUCTS` array from `00-localization.js`.

Then remove or retire the catalog-specific helpers that only exist to service that array:
- `normalizeProduct` fields that are legacy-only;
- `normalizeAllProducts`;
- `getProductById`;
- `getAllProducts`.

Keep unrelated localization/runtime code until its own ownership is separated.

### Step 5 — Remove presentation leaks
Replace the `50+` hero statistic with a canonical runtime count or remove the statistic.

No hard-coded production catalog size.

### Step 6 — Browser proof
Verify:
- Home;
- Shop;
- Search;
- Product detail;
- Compare;
- Featured/deals;
- Beauty Routine;
- Cart;
- Admin/Seller catalog views.

Success criterion:
> the same product shown to customers, Routine, Seller, and Admin resolves to the same canonical row/variant.

## 5. Why this is not a DB data migration

The legacy 50-product dataset is embedded in JavaScript.

It is not a canonical database import source.

Copying those demo objects into `public.products` would:
- create fake/duplicated commercial inventory;
- preserve stale fields;
- confuse production readiness;
- hide the actual C2 supply problem.

Therefore there is deliberately **no legacy-data INSERT migration**.

The catalog migration is primarily a **source cutover** plus canonical DB guardrails.

## 6. Current canonical data warning

Restore-Test currently contains one approved test product:

`Test Vitamin C Serum`

Its current Beauty arrays are empty:
- `skin_types = []`
- `concerns = []`
- `ingredients = []`
- `benefits = []`
- `tags = []`

Production remains frozen and currently has one product with no approved products.

This explains why the current Routine matrix returns `no_matches`; it is a catalog readiness limitation, not evidence that legacy objects should be imported.

## 7. No-apply boundary

No source file is changed by this plan.

No SQL migration is added to `supabase/migrations/` while the gate is locked.

A deferred SQL draft is stored at:
`docs/SQL_DRAFT_CATALOG_UNIFICATION_2026-09-21.sql.draft`
