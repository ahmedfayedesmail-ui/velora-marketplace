# CURRENT.md — Velora Current State

Updated: 2026-09-27

## Where we are
Stage A — Commerce Discovery / Hardening. Production is frozen. Work is on `audit/full-gate-2026-09-25` and Restore-Test only.

Latest branch commit: `b24af9ffbb4686e10726b62950c2c0cfa1bcd7be` (browser-gate update).

Current focus:
1. Product Detail canonical contract — source/DB work complete; Browser Gate still required.
2. Related Products — source gap fixed in frontend enrichment; Browser Gate still required.
3. Store Navigation — source/DB implementation complete; Browser Gate still required.

## Last completed change
Completed customer Store Detail navigation without changing the cart:
- Added `public.velora_get_store_detail(uuid,text,text)` as a SECURITY INVOKER read contract.
- Added the `store` page and `#store/<store_uuid>` deep-link route.
- `Shops → Visit Store` now enters the canonical Store Detail page.
- Product Detail now links to the same Store Detail route using the hydrated canonical `storeId`.
- The Restore-Test function is applied through the recorded migration `20260927190539 / s1_e_store_detail_read_contract`; the Git file is aligned at `supabase/migrations/20260927190539_s1_e_store_detail_read_contract.sql`.

Related Products remains fixed by frontend enrichment of the approved UUIDs returned by the canonical catalog RPC; no catalog schema/contract change was made.

Verified against QA product:
`21d977a0-111b-4bb4-9736-0f2994294d48` — Test Vitamin C Serum.

The detail contract returns product metadata, category/subcategory, ingredients, benefits, usage, warnings, skin types, concerns, tags, seasonal fit, store identity, and display pricing.

Source currency is preserved separately from display currency for cart safety.

## Next step
1. Browser Gate Related Products on the latest Preview when browser tooling is available.
2. Browser Gate Store Navigation from both Shops and Product Detail; verify deep-link `#store/<uuid>` and back navigation.
3. Add the missing critical regression gate(s) for Product Detail / Related / Store using the existing CI/browser infrastructure, without creating a new test framework.

## Evidence state
- Product Detail source verification: PASS
- Product Detail DB contract verification: PASS
- Product Detail deployment evidence: PASS/READY observed on Preview
- Product Detail Browser Gate: PENDING
- Related Products source/DB evidence: fix committed; Preview READY
- Related Products Browser Gate: PENDING (external browser runner unavailable due wallet)
- Store Navigation source/DB evidence: PASS
  - Shops → Visit Store is wired to the store route.
  - Product Detail → Visit Store uses canonical `storeId`.
  - Router supports `#store/<uuid>` and restores the deep link after page activation.
  - `velora_get_store_detail(uuid,text,text)` is SECURITY INVOKER.
  - Approved Store + approved Products are enforced by existing RLS paths.
  - QA store RPC test returned `E2E Seller Store` plus 5 approved products.
  - Pending-store RPC test returned 0 rows.
- Store Navigation Browser Gate: PENDING (interactive browser runner currently unavailable due insufficient wallet balance).
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
The project already has executable CI/browser evidence infrastructure. The target is to make the critical flows self-checking rather than relying on long handoffs. The existing authenticated Playwright gate now covers Store Detail + Related Products as well as the existing cart/checkout path. Current related-products fix enriches only the approved UUIDs already returned by the canonical catalog RPC; no catalog schema/contract change was made.

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

## Current pause/resume point
Resume at **Next step #1**. Do not restart the Store audit. The Store source/DB implementation is already done; only browser evidence and the regression gate remain.
