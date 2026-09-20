# Velora — Sprint 1 Phase B
## Beauty Recommendation Output Contract — 2026-09-20

**Branch:** `sprint-2-s2d-admin`
**Environment:** Restore-Test/local only
**Production:** **FROZEN**
**Contract:** `beauty-recommendation.v1`

## 1. Purpose

Freeze the logical output shape before B1/B2 implementation so persistence, cache, UI, and tests use one contract.

This is a domain contract. The physical transport may be an RPC or another authenticated server operation; B2 will not change the logical response shape.

## 2. Success response

```json
{
  "contract_version": "beauty-recommendation.v1",
  "status": "success",
  "run": {
    "id": "uuid",
    "ruleset_version": "beauty-rules.v1",
    "catalog_revision": "CATALOG_V1:EG-EGP:<revision>",
    "created_at": "timestamp",
    "from_cache": false,
    "cache_expires_at": "timestamp"
  },
  "recommendations": [
    {
      "position": 1,
      "product_id": "uuid",
      "product_variant_id": "uuid-or-null",
      "score": 92.500,
      "reason_codes": [
        "goal_match",
        "concern_match",
        "texture_match"
      ],
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
```

### Output invariants

- `contract_version` is fixed at `beauty-recommendation.v1` until explicitly versioned.
- `status=success` returns 1–5 recommendations.
- `position` is unique and contiguous starting at 1.
- `score` is deterministic and within 0–100.
- `reason_codes` is non-empty.
- `product_id` is always the canonical `products.id`.
- `product_variant_id` is nullable and uses the canonical `product_variants.id`.
- Variant identity is never represented only by display text.
- Currency is explicit; Phase-1 recommendation responses are EGP.
- The response must never expose a client-supplied score or reason code as authoritative input.
- Product display fields are hydrated from the canonical catalog. If the set of response-visible fields changes, the catalog revision contract must be revisited.

## 3. Cached response

A valid cache hit returns the same logical contract, with:

`run.from_cache = true`

No new recommendation run is created on a cache hit.

A cache hit does not consume the new-calculation rate-limit quota.

## 4. Domain states

### Not started / incomplete

```json
{
  "contract_version": "beauty-recommendation.v1",
  "status": "incomplete",
  "run": null,
  "recommendations": [],
  "next_action": "complete_passport"
}
```

The operation does not calculate recommendations for an incomplete Passport.

### No matching products

```json
{
  "contract_version": "beauty-recommendation.v1",
  "status": "no_matches",
  "run": null,
  "recommendations": [],
  "next_action": "none"
}
```

No-match is a valid domain result, not a fake recommendation and not an error.

## 5. Rate-limited response

When no compatible cache entry exists and the authenticated user has reached the server-side limit of **5 new calculations in 10 minutes**, return:

```json
{
  "contract_version": "beauty-recommendation.v1",
  "status": "rate_limited",
  "run": null,
  "recommendations": [],
  "next_action": "retry_later"
}
```

A rate-limit event is recorded only for a new calculation attempt. A cache hit does not create a rate-limit event. A `no_matches` calculation records the attempt even though it does not create a recommendation run.

## 6. Authorization / transport boundary

Authentication failure is handled by the transport/auth layer.

Authorization must always derive the customer from the active Supabase Auth session.

The logical response contains no customer-selected owner UUID.

## 7. Persistence mapping

The existing Phase-A tables remain authoritative for recommendation persistence:

### `beauty_recommendation_runs`
Persists:
- `id`
- `user_id`
- `ruleset_version`
- `catalog_revision`
- `input_snapshot`
- `input_fingerprint`
- `created_at`

### `beauty_recommendation_items`
Persists:
- `run_id`
- `product_id`
- `product_variant_id`
- `position`
- `score`
- `reason_codes`
- `created_at`

Product display data is not a second product model; it is read from canonical `products` / `product_variants`.

## 8. Versioning rule

Breaking output changes require a new contract version, e.g. `beauty-recommendation.v2`.

Adding a non-breaking optional field must still be reviewed against:
- persistence needs
- catalog revision coverage
- frontend compatibility
- B6 regression

No silent contract mutation.

## 9. Explicit non-goals

- No AI/ML explanation text.
- No medical/diagnostic language.
- No legacy `public.recommendation_runs` reuse.
- No commercial ranking or pricing decisions.
