# FIND-BE-029 — Vision vs Data Contract Gap

**Date:** 2026-09-20  
**Priority:** HIGH  
**Status:** OPEN / ARCHITECTURAL  
**Phase:** Post-Phase-B → Phase C

## Problem

The approved Beauty Passport product direction is now **Routine Discovery**, while the existing Phase-A/Phase-B data contract is a deterministic recommendation contract.

The current gap has three parts:

1. `skin_type` is not a persisted canonical Passport input.
2. `routine_budget` is not a persisted canonical Passport input.
3. Five recommendations are not inherently a Routine with defined steps.

## Why this is not a Phase-A/B defect

Phase A/B implemented and verified the existing Recommendation model correctly.

The B2 contract intentionally operates on:

- goal
- concern
- optional texture preference
- optional effect preference
- avoidance preferences
- shopping priority

Changing those contracts during B5/B6 would mix Recommendation Engine closeout with a new Product/Data Model.

Therefore B1/B2 remain technically valid and closed according to their existing scope.

## Required Phase C Work

Phase C must define:

### 1. Beauty Quiz v2

Consumer-language inputs with a three-question minimum path:

- skin type
- primary concern
- routine budget

Additional preferences remain optional.

### 2. Routine Model

A catalog-driven model around:

- Cleanse
- Treat
- Moisturize
- Protect

Rules:

- some steps may be optional;
- unavailable steps must not be fabricated;
- eligibility must come from the actual catalog;
- the model must remain deterministic and explainable;
- no medical diagnosis or treatment inference.

### 3. Contract Versioning

The new Routine contract is a new domain contract and must not silently mutate:

`beauty-recommendation.v1`

The Phase-C contract should be versioned independently.

## Sequence

Approved sequence:

`B5 → B6 → FIND-BE-029 (Open) → Phase C → Routine UX → Sprint 1 UI`

## Review Gate

After Phase-C Routine model design and before implementation:

**Owner Review Gate is mandatory.**

Implementation starts only after Owner review of the Routine model.

## Production Control

FIND-BE-029 does not authorize Production changes.

Production remains **FROZEN** until explicit Owner GO.
