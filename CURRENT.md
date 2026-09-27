# CURRENT.md — Velora Current State

Updated: 2026-09-27

## Where we are
Stage A — Commerce Discovery / Hardening. Production is frozen. Work is on `audit/full-gate-2026-09-25` and Restore-Test only.

Current focus:
1. Product Detail canonical contract — source/DB work complete; Browser Gate still required.
2. Related Products — source gap fixed in frontend enrichment; Browser Gate still required.
3. Store Navigation — confirmed incomplete action; architecture audit pending.

## Last completed change
Added `public.velora_get_product_detail(uuid,text,text)` as a SECURITY INVOKER read contract and wired the canonical UUID Product Detail path in `src/scripts/00-localization.js`.

Verified against QA product:
`21d977a0-111b-4bb4-9736-0f2994294d48` — Test Vitamin C Serum.

The detail contract returns product metadata, category/subcategory, ingredients, benefits, usage, warnings, skin types, concerns, tags, seasonal fit, store identity, and display pricing.

Source currency is preserved separately from display currency for cart safety.

## Next step
1. Browser Gate Related Products on the latest Preview when browser tooling is available.
2. Design/implement Store Detail navigation only after preserving the existing public-read/RLS model; current audit shows no customer-facing store route or dedicated store-detail read contract.
3. Then add the missing critical regression gate(s) rather than another large manual handoff.

## Evidence state
- Product Detail source verification: PASS
- Product Detail DB contract verification: PASS
- Product Detail deployment evidence: PASS/READY observed on Preview
- Product Detail Browser Gate: PENDING
- Related Products source/DB evidence: fix committed; Preview READY
- Related Products Browser Gate: PENDING (external browser runner unavailable due wallet)
- Store Navigation: CONFIRMED INCOMPLETE
  - Shops page exists and lists approved stores.
  - Visit Store currently shows a toast only; no navigation.
  - Platform router has no customer store route.
  - No public store-detail RPC exists.
  - stores has approved-row public SELECT RLS; products has approved-row public SELECT RLS.
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
The project already has executable CI/browser evidence infrastructure. The target is to make the critical flows self-checking rather than relying on long handoffs. Current related-products fix enriches only the approved UUIDs already returned by the canonical catalog RPC; no DB schema/contract change was made.

Critical flows:
- canonical cart / routine add-all
- checkout + idempotency
- legal fail-closed
- Paymob sandbox/webhook evidence
- Product Detail canonical read
- seller/admin critical navigation

A flow is not considered PASS merely because its source looks correct; it needs executable evidence at the appropriate layer.

## Chat continuity
The canonical handoff artifact is this file plus the active Git branch/history. A new chat should:
1. Read CURRENT.md.
2. Inspect the latest commit on audit/full-gate-2026-09-25.
3. Verify Preview/DB evidence only as needed.
4. Continue from the first unresolved item in Next step.
Do not recreate a giant handoff unless a future task specifically needs historical reconstruction.
