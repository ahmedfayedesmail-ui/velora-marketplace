# CURRENT.md — Velora Current State

Updated: 2026-09-27

## Where we are
Stage A — Commerce Discovery / Hardening. Production is frozen. Work is on `audit/full-gate-2026-09-25` and Restore-Test only.

Latest application source/runtime commit: `cb1128e62619e200d5f235e58ed2b69a39409afd` (`fix(startup): mount store deep-link before router resync`). The current branch HEAD is `209ccb3f488099055d1dd199a94d6eaf965850fa`, a browser-test-only hardening commit (`test(browser): classify non-seller reentry guard correctly`). The router return-path source fix is `07bc6b42e6bf6c91d40ae4a2cb012ca714b1ae2f`, and the preceding startup deep-link fix is `dec8bc42b52ea7d7f76a7de2c7b18da485db43ef`.

Current focus:
1. Consolidate the verified local/runtime regression gates for Product Detail, Related Products, and Store Navigation.
2. Obtain a Vercel deployment for the current application source and rerun the Preview Browser Gate against that exact deployed SHA.
3. Keep Production frozen and avoid application changes unless a new evidence-backed defect appears.

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
1. Wait for Vercel to accept a deployment for the current application source state. GitHub still reports the Vercel context as `Deployment rate limited — retry in 24 hours`; the newest READY deployment visible from Vercel is for test-only commit `014bdd...` and predates the current application source fix `cb1128...`.
2. When a deployment matching the current application source is available, rerun the authenticated Preview Browser Gate against that exact deployment and verify the already-proven local flows: direct `store/<uuid>`, Shops → Visit Store → Back, Product Detail canonical hydration, Related Products exclusion, Product Detail → Visit Store, Arabic RTL, and `store/<uuid> → Seller → Marketplace` return.
3. No additional application-code change is justified right now. Continue with the evidence-first rule: new source defect → smallest safe fix → source/DB verification → exact-SHA browser evidence.

## Evidence state
- Product Detail source verification: PASS
- Product Detail DB contract verification: PASS
- Product Detail deployment evidence: PASS/READY observed on the earlier Preview; current branch source has since been browser-validated locally.
- Product Detail Browser Gate: **local-source PASS** on current application source at branch HEAD `209ccb3f488099055d1dd199a94d6eaf965850fa` via run `36348263500` / job `108701761333`. The run served the exact checked-out `src/` tree locally. It passed canonical Store Detail startup, Shops → Store → Back, Product Detail hydration, Related Products exclusion, Visit Store hit-test + normal click, authenticated session, Arabic RTL, `store/<uuid> → Seller → Marketplace → exact store` return, and the guarded non-seller re-entry path. `console_errors=[]`, `page_errors=[]`, and `failures=[]`.
- Vercel Preview Browser Gate: still PENDING because the connected Vercel integration continues to return `build-rate-limit`; do not treat the local-source PASS as deployed-Preview proof.
- Related Products source/DB evidence: PASS. The frontend enriches only approved UUIDs already returned by `velora_get_marketplace_catalog`; no catalog schema/contract change was made.
- Related Products Browser Gate: local-source PASS on `209ccb3...` as part of the run above; deployed Preview evidence remains pending until a matching Vercel deployment exists.
- Store Navigation source/DB evidence: PASS
  - Shops → Visit Store is wired to the store route.
  - Product Detail → Visit Store uses canonical `storeId`.
  - Router supports `#store/<uuid>` and restores the deep link after page activation.
  - `velora_get_store_detail(uuid,text,text)` is SECURITY INVOKER.
  - Approved Store + approved Products are enforced by existing RLS paths.
  - QA store RPC test returned `E2E Seller Store` plus 5 approved products.
  - Pending-store RPC test returned 0 rows.
- Store Navigation Browser Gate: local-source PASS on `209ccb3...` (same run/job above), including direct `#store/<uuid>` startup, Shops → Visit Store, Back to Shops, Product Detail → Visit Store, and exact return to the Store Detail route after Seller platform exit. Deployed Preview evidence remains pending until Vercel serves a deployment matching the current application source.
- Current Vercel build status: GitHub status on `209ccb3...` is `failure` for context `Vercel`, target `https://vercel.com/ahmedconccc-7063?upgradeToPro=build-rate-limit`, with description `Deployment rate limited — retry in 24 hours.` The latest READY deployment visible from Vercel is commit `014bdd3b67c9045be3964cb1a99daeb32a4cdc68`; it predates `cb1128...` and is therefore not evidence for the current startup/router source.
- Production: FROZEN

### Exact-SHA CI evidence at current branch HEAD `209ccb3f...`
- `Velora Full Audit Gate` run `36348263468` / run #258: **SUCCESS**.
  - `Source + Security` job `108701761439`: **SUCCESS** — CodeQL, JavaScript syntax, static audit, script-manifest consistency, Semgrep, and Gitleaks all completed successfully.
  - `Dependency + Web Surface` job `108701761622`: **SUCCESS** — root/src dependency audits, Lighthouse, and OWASP ZAP baseline all completed successfully.
- `Velora Staff Launch Gate Audit` run `36348263483` / run #108: **SUCCESS**.
- `Velora Authenticated Browser Gate` run `36348263462` / run #111: **SUCCESS**.
- `Velora Local Source Browser Gate` run `36348263500` / run #19: **SUCCESS**; job `108701761333` passed the exact-source browser evidence described above.
- The latest CI state therefore has passing source/security, web-surface, staff-launch, authenticated-browser, and exact-local-source browser evidence on the same branch HEAD. This does **not** constitute deployed-Preview evidence while Vercel is rate-limited.



### Local source Browser Gate added
To avoid losing the Vercel rate-limit window, a second browser workflow was added that serves the exact checked-out `src/` tree locally on the GitHub runner and exercises Store Detail, Shops -> Store -> Back, Product Detail canonical hydration, Related Products exclusion, Product Detail -> Visit Store, authenticated login, and the V5 Arabic locale switch. This provides runtime evidence for the current source without depending on a Vercel deployment. It is separate from the Vercel Preview gate and must not be presented as deployment evidence.
- Workflow: `.github/workflows/velora-local-source-browser-gate.yml`
- Commit: `12d1acf17123ee5a537671b6c009ac4df36c2310`


### Startup store deep-link RCA and fix — OBSERVED FACT
A local browser run demonstrated that a fresh `#store/<uuid>` load could be reset before the Store page mounted. The first source fix `dec8bc42b52ea7d7f76a7de2c7b18da485db43ef` taught startup to recognize the store route. A second, stronger fix `cb1128e62619e200d5f235e58ed2b69a39409afd` mounts the existing `#page-store`, sets the existing route state, and calls the existing `loadPageContent('store')` without rewriting the hash. The exact-source Browser Gate on branch HEAD later recorded `initial_store_hash=store/<uuid>`, `initial_store_route_id=<uuid>`, `store_route_active=true`, and no page/console errors.

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

### Store deep-link startup RCA and fix — OBSERVED FACT
The local-source browser gate exposed a distinct startup issue: a direct `#store/<uuid>` load could still end at the root before the Store page mounted. The smallest source fix is in `00-localization.js`: when the initial hash matches a valid store UUID, preserve `VELORA_STORE_ROUTE_ID`, activate `#page-store`, set `STATE.currentPage = 'store'`, and call the existing `loadPageContent('store')` without rewriting the hash. Commit: `cb1128e62619e200d5f235e58ed2b69a39409afd`. Runtime confirmation is pending on the new Browser Gate run.

### Navigation route-return RCA and fix — OBSERVED FACT
`src/scripts/63-platform-router.js` previously stored only the parsed page name when entering a platform, so `store/<uuid>` became `store`. `goMarketplace()` also passed the stored target directly to `activateMarketplace()`, which expects separate `page, storeId` arguments.

Fix commit: `07bc6b42e6bf6c91d40ae4a2cb012ca714b1ae2f`.

The exact-source Browser Gate on branch HEAD now confirms the runtime path: `platform_route_seller_hash=true`, `platform_return_store_hash=true`, and `platform_return_store_active=true`. This converts the earlier runtime hypothesis into observed browser evidence.

### Browser cart 400 — OBSERVED FACT / INFERRED
Restore-Test `Test Vitamin C Serum` is `approved` with stock `23`. At the latest DB check, existing cart quantity for this product across Restore-Test carts was `26`; the browser evidence reported the authenticated local cart quantity as `24` after cloud sync. The `velora_upsert_cart_item(uuid,integer,text)` contract rejects an add when existing customer quantity plus requested quantity exceeds product stock. Because the workflow performs `window.addToCart(test_product, 1)` without first clearing the test user's cart, the observed HTTP 400 is consistent with `INSUFFICIENT_STOCK` and is not currently classified as a Product Detail defect. Exact server error text was not recovered because the log-query backend returned an error, so the RPC error code remains INFERRED rather than directly observed.
Historical note: Full Audit run #232 was cancelled after its source checks completed; that state is superseded by Full Audit run #258 on current branch HEAD, which completed **SUCCESS** for both `Source + Security` and `Dependency + Web Surface`. The current exact-source Browser Gate is also **SUCCESS**. Vercel remains the only deployment-layer blocker.

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
The router/startup fixes are now runtime-verified on the exact checked-out source. Resume at the deployment layer, not by reopening already-verified application code:

- Application source/runtime HEAD: `cb1128e62619e200d5f235e58ed2b69a39409afd`.
- Branch HEAD: `209ccb3f488099055d1dd199a94d6eaf965850fa` (test-only guard change).
- Exact-source local Browser Gate: PASS, run `36348263500` / job `108701761333`.
- Full Audit: PASS, run `36348263468` / #258.
- Staff Launch Gate: PASS, run `36348263483` / #108.
- Authenticated Browser Gate: PASS, run `36348263462` / #111.
- Vercel deployment matching the current application source: still unavailable/rate-limited; do not call the current Preview green until an exact-SHA deployment exists.

The local-source workflow is `.github/workflows/velora-local-source-browser-gate.yml`; it now covers Store Detail startup, Shops → Store → Back, Product Detail canonical hydration, Related Products exclusion, Product Detail → Visit Store, Arabic RTL, and `store/<uuid> → Seller → Marketplace` exact return. Production remains FROZEN.

### Navigation audit finding — RESOLVED / OBSERVED IN BROWSER
The source defect was fixed in `07bc6b42e6bf6c91d40ae4a2cb012ca714b1ae2f`. The exact-source Browser Gate on `209ccb3...` confirms the full round-trip from `store/<uuid>` through Seller and back to the exact Store Detail route.
