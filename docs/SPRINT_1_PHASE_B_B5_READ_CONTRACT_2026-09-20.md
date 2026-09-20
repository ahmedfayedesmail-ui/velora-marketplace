# Velora — Sprint 1 Phase B
## B5 Recommendation Read Contract — 2026-09-20

**Branch:** `sprint-2-s2d-admin`  
**Target:** Restore-Test (`arlaxqmhtvjwjbjinjfw`)  
**Production:** **FROZEN**  
**Contract:** `beauty-recommendation-read.v1`

## 1. Purpose

Expose persisted Beauty recommendation history through a stable, customer-safe read contract without exposing internal recommendation calculation state.

B5 is a read-hardening step only. It does not change the B2 calculation engine, scoring rules, cache semantics, rate-limit semantics, or Phase-C Routine model.

## 2. Canonical Operation

Public RPC:

`public.velora_get_beauty_recommendation_history(p_limit integer default 10)`

Properties:

- `SECURITY INVOKER`
- authenticated EXECUTE only
- anonymous EXECUTE disabled
- no customer/owner UUID parameter
- customer identity is derived from the active Supabase Auth context and enforced by RLS
- requested limit is safely bounded to 1–10

## 3. Response Contract

Success shape:

```json
{
  "contract_version": "beauty-recommendation-read.v1",
  "runs": [
    {
      "run": {
        "id": "uuid",
        "ruleset_version": "beauty-rules.v1",
        "catalog_revision": "CATALOG_V1:EG-EGP:<revision>",
        "created_at": "timestamp"
      },
      "recommendations": [
        {
          "position": 1,
          "product_id": "uuid",
          "product_variant_id": "uuid-or-null",
          "score": 88.000,
          "reason_codes": ["goal_match", "availability_match"],
          "product": {
            "id": "uuid",
            "name": "string",
            "brand": "string-or-null",
            "price": 250.00,
            "currency_code": "EGP",
            "image_url": "string-or-null"
          },
          "variant": {
            "id": "uuid",
            "name": "string",
            "price": 250.00,
            "attributes": {}
          }
        }
      ]
    }
  ]
}
```

An authenticated user with no persisted recommendation runs receives the same contract with `runs: []`.

## 4. Deliberately Omitted Fields

The read contract does not expose:

- `user_id`
- `input_snapshot`
- `input_fingerprint`
- rate-limit ledger data
- cache-hit execution state such as `from_cache`
- internal calculation tables or helper state

The existing raw table data remains protected by RLS and least-privilege column grants. Internal Passport calculation fields are not client-readable.

## 5. Persistence / Catalog Boundary

Persisted recommendation identity remains:

`product_id + product_variant_id`

Product and variant display values are hydrated from the canonical catalog.

If a referenced catalog row is no longer readable under the normal catalog RLS rules, its hydrated display object may be null while the persisted recommendation identity remains available.

## 6. Security Model

### Recommendation runs

Authenticated users can SELECT only the run rows allowed by:

`auth.uid() = user_id`

The `user_id` column remains available to the database policy but is not returned by the read contract.

### Recommendation items

Authenticated users can SELECT only items whose parent run belongs to the current authenticated user.

### Direct writes

Authenticated and anonymous roles have no INSERT/UPDATE/DELETE privilege on recommendation runs or recommendation items.

Recommendation persistence continues to occur through the existing server-side B2 operation.

## 7. Non-goals

- No Routine model
- No `skin_type`
- No `routine_budget`
- No change to `beauty-recommendation.v1`
- No B2 scoring changes
- No browser UI implementation
- No Production changes

Those belong to Phase C and the later Review Gate.

## 8. B5 Exit Criteria

B5 is complete when:

1. Canonical read RPC exists.
2. Authenticated execution is allowed; anonymous execution is denied.
3. Read RPC is SECURITY INVOKER.
4. Cross-user reads return zero rows through RLS.
5. Internal snapshot/fingerprint columns are not client-readable.
6. Direct writes to recommendation runs/items are denied for application roles.
7. Read response is sanitized and deterministic.
8. Restore-Test fixtures are transaction-scoped and rolled back.
9. Supabase Advisor introduces no new B5-specific security warning.

## 9. Phase Status

**B5 = VERIFIED — Restore-Test/source gate.**

B6 regression remains required before Phase B is closed.
