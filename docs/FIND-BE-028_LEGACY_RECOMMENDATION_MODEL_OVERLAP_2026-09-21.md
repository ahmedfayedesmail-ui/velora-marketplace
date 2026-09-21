# Velora — FIND-BE-028
## Legacy Recommendation Model Overlap — 2026-09-21

**Priority:** ARCHITECTURAL  
**Status:** OPEN  
**Environment:** Restore-Test/local documentation  
**Production:** **FROZEN**

## Finding

Velora contains an older recommendation-intelligence model centered on:

- `public.recommendation_runs`
- `velora_get_recommendations(...)`
- `velora_get_recommendation_intelligence()`
- `velora_get_recommendation_quality()`
- `velora_record_recommendation_feedback(...)`

The new Beauty Recommendation foundation intentionally uses separate Beauty-domain persistence and operations.

## Decision

Do not repurpose, rename, or silently migrate the legacy model during Phase B.

Beauty Recommendation uses:

- `public.beauty_recommendation_runs`
- `public.beauty_recommendation_items`
- `public.velora_get_beauty_recommendations()`
- `public.velora_get_beauty_recommendation_history(...)`

## Regression Result

B6 verified the boundary:

`public.recommendation_runs` remained empty during the Beauty Recommendation regression.

No Beauty B1/B2/B5 operation writes to the legacy recommendation table.

## Why It Remains Open

The coexistence of two recommendation models creates future architectural maintenance and product-model rationalization work.

This is not a Phase-B correctness failure.

The issue remains open until a deliberate future architecture decision determines whether and when the legacy model should be retired, isolated further, or converged.

## Phase-C Boundary

Phase C Routine Discovery must remain on the Beauty-domain contract and must not silently reuse the legacy recommendation model.

## Production Control

No Production change is authorized by this finding.
