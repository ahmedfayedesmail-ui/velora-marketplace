# Velora — Sprint 1 Phase B
## Beauty Recommendation Ruleset v1 — 2026-09-20

**Ruleset:** `beauty-rules.v1`
**Environment:** Restore-Test/local only
**Production:** **FROZEN**

## 1. Purpose

Freeze the deterministic 18-rule scorer used by B2. Any scoring-semantic change requires a new `ruleset_version` and B6 regression review.

## 2. Candidate eligibility / exclusion rules

| Rule | Behavior |
|---|---|
| R01 | Product status must be `approved`. Otherwise exclude. |
| R02 | Product currency must be `EGP`. Otherwise exclude. |
| R03 | Product must be purchaseable: base stock > 0 OR an active in-stock variant exists. |
| R04 | Product category must resolve to `beauty`. Otherwise exclude. |
| R13 | If any Passport avoidance ingredient matches a product ingredient, exclude. |
| R14 | If any Passport avoidance tag matches a product tag, exclude. |

## 3. Scoring rules

Positive scoring weights total **100 points**:

| Rule | Match | Weight |
|---|---|---:|
| R05 | Goal matches product `tags` or `benefits` | +30 |
| R06 | Goal matches product `category` or `subcategory` | +10 |
| R07 | Concern matches product `concerns` | +20 |
| R08 | Concern matches product `benefits` or `tags` | +5 |
| R09 | Texture matches selected active variant attributes | +8 |
| R10 | Texture matches product `tags` or `subcategory` | +7 |
| R11 | Effect matches selected active variant attributes | +7 |
| R12 | Effect matches product `benefits` or `tags` | +3 |
| R15 | `shopping_priority` matches deterministic relative-price rule | +5 |
| R16 | Candidate has a valid purchase path / availability | +5 |

## 4. Shopping-priority rule

B2 recognizes:

- `value`: candidate unit price <= eligible-catalog median
- `premium`: candidate unit price >= eligible-catalog median
- `balanced`: candidate unit price is within 75%–125% of the eligible-catalog median

Unknown/null values receive no R15 points.

The median is recalculated from the current eligible catalog; catalog changes therefore invalidate the cached run through `catalog_revision`.

## 5. Variant / ordering rules

| Rule | Behavior |
|---|---|
| R17 | When active in-stock variants exist, select the lowest-price variant; ties resolve by variant UUID. This is the canonical commerce variant attached to the recommendation. |
| R18 | Final deterministic ordering is score DESC, then product UUID ASC. No randomness. |

R17 and R18 are deterministic selection/order rules and do not add score points.

## 6. Reason-code mapping

Persisted explanation codes are derived from these rule families:

- R05/R06 → `goal_match`
- R07/R08 → `concern_match`
- R09/R10 → `texture_match`
- R11/R12 → `effect_match`
- R15 → `preference_match`
- R16 → `availability_match`

Every persisted result must contain at least one reason code.

## 7. Determinism contract

Same:

`Passport input + catalog revision + ruleset version`

must yield the same ranked product/variant identifiers, scores, and reason-code set.

The B2 operation uses a stable SHA-256 Passport fingerprint plus the catalog revision and ruleset version in the cache identity.

## 8. Safety / product boundary

- No AI/ML.
- No medical or diagnostic inference.
- No free-form model explanation.
- No commercial pricing policy is encoded beyond the documented engineering shopping-priority heuristic.
