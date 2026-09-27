# CURRENT.md — Velora Current State

Updated: 2026-09-27

## Where we are
Stage A — Commerce Discovery / Hardening. Production is frozen. Work is on `audit/full-gate-2026-09-25` and Restore-Test only.

Latest application source/runtime commit: `07bc6b42e6bf6c91d40ae4a2cb012ca714b1ae2f` (`fix(router): preserve store deep-link return route`). Latest browser-gate-only commits are `437cf1edb27e71ff7b019a212713799f8966defb`, `9ab16f9fa851459dc49686d5aa638be25a2e1002`, `12d1acf17123ee5a537671b6c009ac4df36c2310`, `0be23386cc2edf0fb2ec44d55518d4b5a1d1ddd6`, and `ffe1e0756961639ca5619b4c3ca27c7f60e5a6d8`; the Product Detail and localization runtime fixes remain included in history.

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
1. Wait for a real Vercel deployment of the current application source (`07bc6b42e6bf6c91d40ae4a2cb012ca714b1ae2f`); the branch contains browser-test fixture hardening commits as well, but Vercel remains rate-limited so the existing branch alias is stale.
2. Once a deployment for `dc157...` exists, rerun the authenticated Browser Gate and verify Product Detail -> Visit Store, Related Products, Shops -> Visit Store, and Back to Shops.
3. Keep the strengthened existing Playwright gate as the critical regression gate; do not treat runs against the stale Preview as evidence for current source.

## Evidence state
- Product Detail source verification: PASS
- Product Detail DB contract verification: PASS
- Product Detail deployment evidence: PASS/READY observed on Preview
- Product Detail Browser Gate: PENDING on current source (runs #83/#84 were against stale Preview and are not valid current-code proof).
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
- Store Navigation Browser Gate: current-code PENDING; however the deployed pre-fix browser gate already proved direct Store Detail, Shops -> Visit Store, and Back to Shops on the then-current Preview.
- Current Vercel build status: BLOCKED by connected Vercel `build-rate-limit` (`Deployment rate limited — retry in 24 hours.` observed on commit `dc157...`). The latest READY deployment in the accessible deployment list is commit `31cc7209357df97620c093709703d7561dce476f`; therefore Runs #83/#84 did not exercise `79c8...` or `dc157...` source changes.
- Production: FROZEN



### Local source Browser Gate added
To avoid losing the Vercel rate-limit window, a second browser workflow was added that serves the exact checked-out `src/` tree locally on the GitHub runner and exercises Store Detail, Shops -> Store -> Back, Product Detail canonical hydration, Related Products exclusion, Product Detail -> Visit Store, authenticated login, and the V5 Arabic locale switch. This provides runtime evidence for the current source without depending on a Vercel deployment. It is separate from the Vercel Preview gate and must not be presented as deployment evidence.
- Workflow: `.github/workflows/velora-local-source-browser-gate.yml`
- Commit: `12d1acf17123ee5a537671b6c009ac4df36c2310`

## Latest Browser Gate hardening
The authenticated browser workflow now resets the QA test product from the authenticated cart through the normal `window.removeFromCart()` path, waits for canonical cloud-cart sync, and asserts the product is absent before adding one unit. This addresses the observed accumulated-fixture condition that produced the 400 `velora_upsert_cart_item` response after repeated runs. This is a test-fixture change only; no application cart code, RPC, or schema was changed.
- `437cf1edb27e71ff7b019a212713799f8966defb` — reset cart fixture before add.
- `9ab16f9fa851459dc49686d5aa638be25a2e1002` — assert reset success/absence before add.

## Latest RCA / source-hardening changes
### Product Detail handler collision — OBSERVED FACT
`src/scripts/52-s2a-variants.js` overwrote `window.openProductDetail` and, when a catalog row already existed, short-circuited the canonical hydration wrapper from `00-localization.js`. Runtime browser inspection showed `window.openProductDetail` ultimately came from the reviews wrapper in `53-s2c-reviews.js`, with `52-s2a-variants.js` underneath it. Direct browser RPC diagnostics confirmed `velora_get_product_detail` returned the correct `store_id`, while `_veloraDetailHydrated` stayed false.

Fix commit: `79c8ed1b9e6d06417979a66d9d43081def92cd25`. The variants handler now invokes its captured original handler before variant rendering and the variant renderer includes the canonical Visit Store control.

### Localization syntax error — OBSERVED FACT
`Run #84` captured `Uncaught SyntaxError: Unexpected token 'else'` at `/scripts/12-localization.js`, line 160, column 1355. The exact source defect was a missing semicolon after `await window.VELORA_RENDER_TRUST()`. Fix commit: `dc157200fdde96e809e6d18998a41a14da42183f`.

### Vercel deployment blocker — OBSERVED FACT
GitHub status for `dc157...` reports `Deployment rate limited — retry in 24 hours.` No Vercel deployment for `79c8...`, `2cd...`, or `dc157...` is currently visible in the accessible deployment list. Browser runs #83/#84 therefore remain stale-Preview diagnostics, not validation of the current source.

### Navigation route-return RCA and fix — OBSERVED FACT
`src/scripts/63-platform-router.js` previously stored only the parsed page name when entering a platform, so `store/<uuid>` became `store`. `goMarketplace()` also passed the stored target directly to `activateMarketplace()`, which expects separate `page, storeId` arguments.

Fix commit: `07bc6b42e6bf6c91d40ae4a2cb012ca714b1ae2f`.

Fix: preserve `store/<uuid>` in the return route and re-parse it before marketplace activation. The source-level defect is OBSERVED; browser/runtime impact is INFERRED until Browser Gate evidence confirms it.

### Browser cart 400 — OBSERVED FACT / INFERRED
Restore-Test `Test Vitamin C Serum` is `approved` with stock `23`. At the latest DB check, existing cart quantity for this product across Restore-Test carts was `26`; the browser evidence reported the authenticated local cart quantity as `24` after cloud sync. The `velora_upsert_cart_item(uuid,integer,text)` contract rejects an add when existing customer quantity plus requested quantity exceeds product stock. Because the workflow performs `window.addToCart(test_product, 1)` without first clearing the test user's cart, the observed HTTP 400 is consistent with `INSUFFICIENT_STOCK` and is not currently classified as a Product Detail defect. Exact server error text was not recovered because the log-query backend returned an error, so the RPC error code remains INFERRED rather than directly observed.
Full Audit run #232 was cancelled after its source checks had already completed successfully (CodeQL, JS syntax, static audit, manifest consistency, Semgrep, Gitleaks); the second web-surface job completed successfully. No current-code Browser PASS exists because Vercel is rate-limited.

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
Resume from the router deep-link fix at `07bc6b42e6bf6c91d40ae4a2cb012ca714b1ae2f`. The source defect was observed in `63-platform-router.js`: `store/<uuid>` was reduced to `store` when saved for platform return, and `goMarketplace()` did not re-parse a stored store route before activation. The fix preserves the full store route and re-parses it before activation. Browser/runtime impact remains unverified until a current Browser Gate run.

The local-source browser workflow is `.github/workflows/velora-local-source-browser-gate.yml` and now also covers the regression `store/<uuid> → Seller → Marketplace`, asserting return to the exact store deep-link. No visible run result is available through the current GitHub connector for the push-triggered workflow, so this remains an added executable gate, not a PASS. Vercel remains blocked by the connected `build-rate-limit`. Do not treat stale Preview runs as evidence for the current source. Production remains FROZEN.

### Navigation audit finding — OBSERVED FACT from source
`src/scripts/63-platform-router.js` stores `currentMarketplaceHash()` as the parsed page name only, so a `store/<uuid>` deep-link is reduced to `store` when entering a seller/admin/owner platform. `goMarketplace()` then calls `activateMarketplace(target)` without re-parsing a store route. This is an unverified browser-path finding, not yet classified as a runtime defect and not yet changed.
