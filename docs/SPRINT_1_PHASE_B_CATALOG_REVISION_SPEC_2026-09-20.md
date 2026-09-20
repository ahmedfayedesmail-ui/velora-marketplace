# Velora — Sprint 1 Phase B
## Beauty Catalog Revision Specification — 2026-09-20

**Branch:** `sprint-2-s2d-admin`
**Environment:** Restore-Test/local only
**Production:** **FROZEN**
**Revision token:** `CATALOG_V1:EG-EGP:<revision>`

## 1. Purpose

`catalog_revision` identifies the recommendation-relevant catalog state used by a calculation.

It prevents a 24h cached recommendation from being reused after a catalog change that can alter eligibility, scoring inputs, purchaseability, or displayed recommendation data.

## 2. Scope

Phase-1 revision scope is the Egypt / EGP recommendation catalog.

Authoritative sources:

- `products`
- `product_variants`

No second product/catalog table is introduced.

## 3. Revision mechanism

Use a server-side monotonic revision counter scoped to the recommendation catalog:

### Logical table

`beauty_catalog_revision`

| Column | Type | Rule |
|---|---|---|
| `scope` | text | PK; MVP value `EG-EGP` |
| `revision` | bigint | starts at 1 and increases monotonically |
| `updated_at` | timestamptz | server timestamp |

The authoritative token is:

`CATALOG_V1:EG-EGP:<revision>`

The counter is changed in the same database transaction as the catalog mutation.

## 4. What increments the revision

Use database triggers or the future authoritative catalog-write path so the revision cannot depend on browser behavior.

### `products`

Increment on INSERT/DELETE.

Increment on UPDATE when any recommendation-relevant or response-visible field changes, including:

- `status`
- `price`
- `original_price`
- `stock`
- `currency_code`
- `category`
- `subcategory`
- `skin_types`
- `concerns`
- `tags`
- `benefits`
- `ingredients`
- `name`
- `brand`
- `images`

### `product_variants`

Increment on INSERT/DELETE.

Increment on UPDATE when any of these changes:

- `product_id`
- `name`
- `price`
- `stock_quantity`
- `attributes`
- `is_active`

The list is intentionally tied to the recommendation output/matching contract.

## 5. Fields that do not increment it in the MVP

A field that is not used by the recommendation scorer and is not rendered by the recommendation contract does not cause invalidation.

For example, an internal-only catalog field may remain outside the revision set.

If a future release starts using/displaying such a field, the revision specification must be updated before release.

## 6. Why a monotonic counter

Compared with scanning the full catalog and hashing every row on every request, a monotonic revision:

- gives O(1) lookup during recommendation execution;
- avoids expensive whole-catalog hashing;
- makes insert/update/delete invalidation explicit;
- is transaction-safe;
- gives B2 a compact value to persist in every run.

A single catalog change invalidates cached runs for the Phase-1 catalog. This is an accepted MVP trade-off; per-segment revisions can be considered after real workload data exists.

## 7. Ruleset interaction

A scorer change must change `ruleset_version`.

A catalog-state change must change `catalog_revision`.

A Passport-input change must change `input_fingerprint`.

A reused run is valid only when all three version/key components still match.

## 8. Initial rollout

At B2 implementation:

1. create the revision row with `revision=1`;
2. add authoritative increment logic;
3. verify current catalog state maps to the initial token;
4. change a test product/variant in Restore-Test;
5. verify the revision increments;
6. roll back test data;
7. verify the final revision token remains internally consistent.

Production changes are explicitly out of scope.

## 9. Important edge rule

Stock and purchaseability changes are revision-relevant.

For example:

`stock 1 → 0`

must invalidate a cached recommendation that depended on that product being purchasable.

A price change must also invalidate because price may affect budget/affordability matching and the displayed recommendation price.

## 10. Versioning

`CATALOG_V1` is part of the token so a future change to the revision algorithm or revision-covered field set can invalidate old cached runs even when the numeric counter is unchanged.
