# CURRENT.md — Velora Current State

Updated: 2026-09-27

## Where we are
Stage A — Commerce Discovery / Hardening. Production is **FROZEN**. Work is on `audit/full-gate-2026-09-25` and Restore-Test only.

**Latest application source/runtime commit:** `5fe1df465d959585057643295afd05c94532d2c1` (`fix(auth): preserve signup redirect on active handler`).

**Current branch HEAD:** `857d1cad5e5a958ff3234b65d1eb7fd54d9c5cde` (`test(browser): serialize shared authenticated e2e fixture`). The commits after `5fe1...` in this phase are test/documentation changes only; they do not change application runtime source.

**Latest deployed Preview:** Vercel deployment `dpl_AqktBmT8SfH2bfwuu8SuuTaECNhT`, READY, Git SHA `8c92169130321d6e1877bed54db3867120408d05`. The branch alias `velora-marketplace-git-audit-full-gate-c558d2-ahmedconccc-7063.vercel.app` currently resolves to that deployment. Commit review confirms `8c921...`, `a63a...`, and `857d...` are test-workflow-only commits, so the deployed application source still contains the latest application change `5fe1...`. **This is not an exact deployed-`857d` proof.**

## Latest authoritative gate state — 2026-09-27

### CI — current branch HEAD `857d1cad...`
- **Velora Local Source Browser Gate #34** — run `36350826053` — **SUCCESS**. This is exact checked-out source/runtime evidence on `857d...`.
- **Velora Authenticated Browser Gate #124** — run `36350826137` — **SUCCESS**. The workflow is configured against the branch alias; because the alias currently resolves to deployed SHA `8c921...`, the run is browser evidence against the current deployed application source tree but **not exact-SHA `857d...` deployment evidence**.
- **Velora Staff Launch Gate Audit #121** — run `36350826122` — **SUCCESS**. The audit RPCs succeeded, but the workflow's configured Preview URL/tested SHA are historical; treat this as launch-gate logic evidence, not current Preview-source proof.
- **Velora Full Audit Gate #271** — run `36350826097` — **SUCCESS**.
  - Source + Security: **SUCCESS** — CodeQL, JavaScript syntax, static audit, script-manifest consistency, Semgrep, Gitleaks.
  - Dependency + Web Surface: **SUCCESS** — root/src dependency audits, Lighthouse, OWASP ZAP baseline.

### Shipping / tracking
- Shipping customer lifecycle is now **Browser PASS** via authenticated Browser Gate #118 (run `36350031772`) using Restore-Test order #71 and shipment `230c342e-07bf-4856-a497-6c047916f01a`.
- Evidence covered order #71, shipment details, service, status, tracking number, tracking URL, ETA, and no runtime/page/console errors.
- Do not reopen shipping unless new evidence appears.

### Notifications
- Shipment-status notification trigger is **DB/runtime verified**: changing shipment #71 to `delivered` created the expected `notifications` row for the authenticated E2E customer.
- Customer notification surface was verified in Local Source Browser Gate #33 (run `36350705280`) and the latest Local Source Browser Gate #34 also completed **SUCCESS** on branch HEAD `857d...`.
- No new notification table/system was introduced; the existing notification foundation is reused.

### Authentication redirect
- Active signup handler fix: commit `5fe1df465d959585057643295afd05c94532d2c1`.
- The active handler passes `emailRedirectTo = window.location.origin`.
- Authenticated Browser Gate #124 completed **SUCCESS** and exercised the redirect assertion through the branch Preview alias.
- Because the alias resolves to deployed SHA `8c921...` while branch HEAD is `857d...`, classify this as **source + browser-observed deployed-tree evidence**, not exact deployed-`857d` evidence.

### Test-fixture isolation
- Commit `857d1cad...` adds workflow concurrency to serialize the shared authenticated E2E fixture.
- This is test-harness-only; no cart architecture, RPC, or schema rewrite.
- The serialized Auth #124 and Local Source #34 both completed **SUCCESS**, so the previous concurrent-fixture failure mode is no longer reproduced under the serialized workflow.

### Returns / refunds
- Existing return/dispute backend is **source + DB audited**.
- The customer-facing Return/Dispute control currently records a post-purchase support event instead of creating a governed `return`/ `dispute` object.
- This is an **OBSERVED customer UX gap**.
- It is intentionally **BLOCKED on business/legal economics** (shipping, discounts, commissions, payment fees, COD, return shipping, seller earnings/reversal rules, etc.). Do not invent those rules in frontend code.
- Refund execution is separate from return resolution; no provider refund execution is claimed.

### Support-case security
- Targeted Restore-Test DB verification confirms `velora_update_support_case(uuid,text,text,uuid,text)` is SECURITY DEFINER, `anon` EXECUTE is false, and `authenticated` EXECUTE is true.
- Existing `support_cases` RLS currently allows authenticated insert only for own requester rows and authenticated select for requester/owner/staff.
- Restore-Test currently has **0 support_cases**, so there is no existing fixture for a real browser/operational case update proof.
- The owner-assignment hardening remains **source + DB verified**; Browser/operational proof is **PENDING** only if a real existing UI/fixture is later identified. No support-case schema change is justified now.

## Current direction
1. Do **not** add new commerce subsystems. Reuse existing Velora cart/order/shipment/notification/returns/admin contracts.
2. Do **not** modify Production.
3. Do **not** treat the current Vercel alias as exact `857d` deployment proof; the alias resolves to `8c921...`.
4. Do **not** engineer Returns/Refunds until commercial/legal rules are defined.
5. For the next Stage A item, start with source → DB contract → permissions → smallest safe change → exact browser proof. If no concrete gap is reproducible, document it and move on.

## Verified pause point
The currently justified engineering work is **not another UI rewrite**. The critical latest evidence is:

- exact-source browser: PASS on `857d...`;
- Full Audit: PASS on `857d...`;
- Staff Launch: SUCCESS on `857d...` (historical Preview URL in workflow; not current Preview proof);
- Authenticated Browser: SUCCESS through branch alias, whose Vercel deployment is `8c921...`;
- latest application source change: `5fe1...`;
- Vercel latest READY deployment: `8c921...`;
- Shipping browser proof: PASS (#118);
- Shipment notification DB + customer-surface proof: PASS;
- Returns customer workflow: GAP OBSERVED / BLOCKED on business-legal economics;
- Support-case owner-assignment hardening: source + DB verified / browser proof pending;
- Production: **FROZEN**.

The next action should be the **first unresolved Stage A item with a real, reproducible gap**. Do not reopen Product Detail, Related Products, Store Navigation, Shipping, Notifications, or cart architecture without new evidence.


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
The router/startup fixes are now runtime-verified on the exact checked-out source **and on the deployed Preview tree**. Resume at the next Stage A audit item, not by reopening already-verified Product Detail/Related Products/Store Navigation code:

- Application source/runtime commit: `cb1128e62619e200d5f235e58ed2b69a39409afd`.
- Latest verified application/deployment tree: `8aca74f990e57ff7c36570c444afccef73ee5b34`. Subsequent branch commits in this phase are documentation-only evidence updates; the application source remains unchanged.
- Exact-source local Browser Gate: PASS, run `36348789512` / #22.
- Deployed Preview Authenticated Browser Gate: PASS, run `36348789479` / #112, tested SHA `8aca...`.
- Full Audit: PASS, run `36348789535` / #259.
- Staff Launch Gate: PASS, run `36348789546` / #109.
- Vercel: READY + GitHub status SUCCESS for `8aca...`.

Verified flows include Store Detail startup, Shops → Store → Back, Product Detail canonical hydration, Related Products exclusion, Product Detail → Visit Store, Arabic RTL, cart/checkout continuity, and `store/<uuid> → Seller → Marketplace` exact return. Production remains FROZEN.

### Navigation audit finding — RESOLVED / OBSERVED IN BROWSER
The source defect was fixed in `07bc6b42e6bf6c91d40ae4a2cb012ca714b1ae2f`. The exact-source Browser Gate on `209ccb3...` confirms the full round-trip from `store/<uuid>` through Seller and back to the exact Store Detail route.
