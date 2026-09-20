# Velora — FIND-BE-028
## Legacy Recommendation Model Overlap — 2026-09-20

**Priority:** MEDIUM  
**Status:** OPEN / ARCHITECTURAL  
**Environment:** Restore-Test + source/database inspection  
**Production:** FROZEN

## Finding

The existing `public.recommendation_runs` table is a legacy recommendation-intelligence model already used by existing Velora functions, including the current `velora_get_recommendations` path.

Sprint 1 Beauty MVP requires a different deterministic, versioned personalization contract.

## Evidence

Restore-Test inspection confirmed:

- `public.recommendation_runs` already exists.
- Existing functions read/write this table.
- Existing columns include legacy concepts such as `session_key`, `consent_required`, `consent_granted`, `strategy`, `status`, `candidate_count`, and `returned_count`.
- The existing recommendation functions are part of the current intelligence/control-plane boundary.

## Decision already applied

The Beauty MVP does **not** modify or repurpose the legacy table.

Dedicated Beauty tables are used instead:

- `beauty_recommendation_runs`
- `beauty_recommendation_items`

This isolates the new deterministic Rules Engine from the legacy recommendation/intelligence contract.

## Why this remains a finding

The overlap is now contained technically, but it remains an architectural debt item that must be kept explicit so future engineers do not merge the two recommendation models accidentally.

## Required follow-up

Before Production GO, document the long-term boundary between:

1. legacy recommendation intelligence;
2. Beauty deterministic personalization;
3. any future unified recommendation platform.

No production migration or code change is required for this finding at the current stage.

**Conclusion:** OPEN — documented containment in place.
