# Velora — Sprint 1 Phase B
## Beauty Passport Input Fingerprint Specification — 2026-09-20

**Branch:** `sprint-2-s2d-admin`
**Environment:** Restore-Test/local only
**Production:** **FROZEN**
**Fingerprint:** SHA-256 over canonical UTF-8 JSON

## 1. Purpose

The input fingerprint identifies the exact Beauty Passport input used for a deterministic recommendation calculation.

It is a cache key component, not an authorization mechanism.

## 2. Canonical input payload

For MVP, the canonical fingerprint payload is:

```json
{
  "schema_version": "beauty-passport.v1",
  "quiz_version": "beauty-quiz.v1",
  "market_scope": "EG",
  "currency_code": "EGP",
  "goal": "...",
  "concern": "...",
  "texture_preference": "...",
  "effect_preference": "...",
  "avoidance_preferences": {},
  "shopping_priority": "..."
}
```

### Included

- `schema_version`
- `quiz_version`
- all persisted Beauty Passport preference fields
- fixed Phase-1 market context: `EG`
- fixed Phase-1 currency context: `EGP`

### Explicitly excluded

- `user_id` — ownership is a separate cache-key component.
- `updated_at` — same inputs must remain cache-compatible after a profile refresh that does not change the inputs.
- session identifiers
- browser state
- timestamps
- free-form UI labels when a canonical answer value exists
- product IDs
- product data
- recommendation scores/reason codes
- budget, because no `budget` field exists in the approved `beauty_profiles` schema.

If a future Passport version adds budget, it must be introduced into the canonical payload and the Passport schema version must advance.

## 3. Normalization

Before hashing:

- trim surrounding whitespace from scalar text;
- normalize empty strings to JSON `null`;
- use lowercase canonical answer identifiers where the quiz contract defines identifiers as case-insensitive;
- deduplicate avoidance values;
- sort avoidance object keys;
- sort set-like avoidance arrays;
- preserve order only for fields whose order is semantically meaningful;
- serialize with stable key ordering and no insignificant whitespace.

The exact canonicalization routine must be shared by all server code that computes the fingerprint.

## 4. Hash

`input_fingerprint = SHA-256(canonical_json_utf8)`

Store the lowercase hexadecimal digest in `beauty_recommendation_runs.input_fingerprint`.

The browser is not authoritative for this value; B2 recomputes it server-side.

## 5. Invalidating changes

### Passport value changes

Any change to a fingerprinted value changes the hash and therefore prevents reuse of an older compatible run.

### New Passport field

When a new field becomes recommendation-relevant:

1. add it to the persisted Passport contract;
2. increment `schema_version`;
3. include it in canonical fingerprint input;
4. invalidate all previous cache keys naturally because the hash changes;
5. update B6 regression fixtures.

### Quiz wording only

Quiz wording may change without invalidating recommendations when it maps to the same canonical answer values and `quiz_version` remains compatible.

### Quiz contract change

If answer semantics change, increment `quiz_version` even when the database column set is unchanged.

## 6. Cache-key relationship

The full reusable-run identity is:

```
user_id
+ input_fingerprint
+ ruleset_version
+ catalog_revision
```

A fingerprint collision is considered cryptographically impractical for the MVP.

## 7. Testing contract

B2/B6 must include:

- same canonical inputs → same fingerprint;
- whitespace-only changes after normalization → same fingerprint;
- avoidance key reordering → same fingerprint;
- different goal/concern/preferences → different fingerprint;
- schema version change → different fingerprint;
- user change with same Passport → different cache ownership because `user_id` is separate.

## 8. Security boundary

The fingerprint does not replace RLS, Auth, or ownership checks.

A matching fingerprint alone must never authorize access to another user's run.
