# ADR — Beauty Passport = Routine Discovery

**Date:** 2026-09-20  
**Status:** ACCEPTED  
**Scope:** Product direction / Beauty Passport

## Decision

**Beauty Passport exists to turn beauty-product confusion into one clear, trustworthy routine with the least possible effort.**

The customer-facing experience is therefore **Routine Discovery**, not a technical quiz or a generic recommendation list.

## Customer Language

The approved primary experience uses:

- CTA: **اعرفي روتينك**
- Output: **روتينك**
- Primary action: **اطلبي الروتين كله**

The quiz is an implementation mechanism and should not dominate the user-facing terminology.

## Minimum Discovery Path

The target minimum path is three consumer-language questions:

1. skin type
2. primary concern
3. routine budget

Additional preferences may remain optional.

## Explanation Principle

Each product explanation must be a single line derived from real persisted inputs and rule evidence.

The system must not invent contextual claims that were not part of the actual recommendation logic.

## Routine Principle

The future Routine model is catalog-driven.

The implementation must:

- allow optional steps;
- never fabricate unavailable steps or products;
- derive eligibility from the real catalog;
- preserve deterministic behavior;
- avoid medical diagnosis/treatment claims.

## Engineering Boundary

The current B1/B2 Recommendation Engine remains unchanged through B5/B6.

The Routine contract is a Phase-C design problem and requires a versioned Data Contract v2.

## Mandatory Review Gate

After Phase-C design and before implementation:

**Owner reviews and approves the Routine model.**

No Routine implementation begins before that review gate.

## Success Philosophy

The product principle guiding this decision is:

> A product deserves millions when it solves a real problem for a real audience quickly and simply.

Beauty Passport operationalizes that principle by reducing beauty-product choice overload to one understandable routine.
