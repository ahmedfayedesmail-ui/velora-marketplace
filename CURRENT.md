# CURRENT.md — Velora Current State

Updated: 2026-09-27

## Where we are
Stage A — Commerce Discovery / Hardening. Production is frozen. Work is on `audit/full-gate-2026-09-25` and Restore-Test only.

Current focus:
1. Product Detail canonical contract — source/DB work complete; Browser Gate still required.
2. Related Products — confirmed data-contract gap; no fix applied yet.
3. Store Navigation — confirmed incomplete action; architecture audit pending.

## Last completed change
Added `public.velora_get_product_detail(uuid,text,text)` as a SECURITY INVOKER read contract and wired the canonical UUID Product Detail path in `src/scripts/00-localization.js`.

Verified against QA product:
`21d977a0-111b-4bb4-9736-0f2994294d48` — Test Vitamin C Serum.

The detail contract returns product metadata, category/subcategory, ingredients, benefits, usage, warnings, skin types, concerns, tags, seasonal fit, store identity, and display pricing.

Source currency is preserved separately from display currency for cart safety.

## Next step
Audit and fix Related Products using the smallest canonical-data change that preserves the existing catalog contract where possible. Then audit Store Navigation before implementing it.

## Evidence state
- Product Detail source verification: PASS
- Product Detail DB contract verification: PASS
- Product Detail deployment evidence: PASS/READY observed on Preview
- Product Detail Browser Gate: PENDING
- Related Products contract gap: CONFIRMED
- Store Navigation incomplete action: CONFIRMED
- Production: FROZEN

## Core rules
- Do not rewrite the cart.
- Do not add MutationObservers or arbitrary click listeners.
- Do not change schema without proof.
- Do not modify Production.
- Do not resurrect V1 Beauty Passport.
- Do not introduce contract fields casually.
- Do not claim Browser PASS from source inspection or SQL simulation.
- Prefer smallest safe change + source check + DB check + Preview + Browser Gate.
- Consultant/reviewer is for RCA/review, not implementation ownership.

## Regression-test direction
The project already has executable CI/browser evidence infrastructure. The target is to make the critical flows self-checking rather than relying on long handoffs:
- canonical cart / routine add-all
- checkout + idempotency
- legal fail-closed
- Paymob sandbox/webhook evidence
- Product Detail canonical read
- seller/admin critical navigation

A flow is not considered PASS merely because its source looks correct; it needs executable evidence at the appropriate layer.
