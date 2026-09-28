# CURRENT.md — Velora Current State

Updated: 2026-09-28

## Latest authoritative continuation — 2026-09-28

Production remains FROZEN. All engineering below was performed against audit/full-gate-2026-09-25 and Restore-Test only.

### Seller product metadata — CLOSED at source/DB level, Browser proof pending
- Commit f8e498583b3ae06f36c62d0b195d4657256749f5 adds canonical Seller Product Editor fields for ingredients, benefits, skin_types, and concerns.
- DB contract verified: all four columns are jsonb NOT NULL DEFAULT []; existing product RLS ownership policies remain in place.
- Routine engine inspection confirms these fields are consumed for skin-type, concern, goal, and ingredient-avoidance matching.
- Exact Preview dpl_6hWXGnt6c3hY4ho7CZx9c6BmJGnd was READY on f8e498....
- All four gates on f8e498... completed SUCCESS.
- Browser proof remains PENDING because the authenticated browser gate has only the shared customer E2E credentials; no Seller-specific credentials are configured. Do not manufacture a Seller fixture/credential solely to create a PASS.

### Seller product security hardening — CLOSED at DB + CI/deployment level
- Initial DB simulation exposed a real cross-store INSERT gap: an approved Seller could direct-insert a product against a non-approved/non-owned store. The transaction was rolled back; no probe data persisted.
- Commit 5669c2c57ea1aea1679a63f3eb4d2db5d606d58d hardened the existing private.velora_guard_product_mutation() to require the Seller's own approved store on INSERT.
- The invalid cross-store probe failed with STORE_NOT_ACTIVE; a valid approved-store INSERT succeeded and was rolled back.
- A second DB simulation exposed an entitlement bypass: the canonical direct INSERT path did not call the existing velora_assert_seller_product_capacity(). The Restore-Test Free plan has max_products = 25; the probe demonstrated that 26 products could otherwise be reached inside one transaction.
- Commit 3f32c6291e602ef6db9c225b7463ca437c6c3eb3 added the existing capacity assertion to the same trigger. No new table, policy architecture, or schema field was introduced.
- Post-fix DB proof: attempt to insert 21 more products from a 5-product Seller failed at SELLER_PRODUCT_LIMIT_REACHED once count reached 25. A valid single-product insert still succeeded, retained all beauty metadata, and was rolled back.
- Probe rows count after rollback: 0.
- On exact commit 3f32c629...: Local Source Browser Gate #38 SUCCESS, Authenticated Browser Gate #128 SUCCESS, Staff Launch Gate #125 SUCCESS, Full Audit Gate #275 SUCCESS.
- Exact Vercel Preview dpl_3ReLBMjvqvYSj9btYNhqY9ELvQJq is READY with Git SHA 3f32c629....
- This hardening is DB/CI/deployment verified. It is not being called Seller UI Browser PASS.

### Current Seller status
- Seller fixture: f7b4ea90-9470-4827-b9ae-23532765f021, user 2bf8c15d-543e-400d-83fa-50f28bb9beff, approved.
- Restore-Test Free plan limit: 25 products; fixture currently has 5 products.
- Canonical Seller Editor remains src/scripts/12-localization.js; no return to the legacy localStorage Seller path.
- No Production change.

### Store lifecycle hardening — CLOSED at DB + CI/deployment level
- Initial DB transaction probes showed an approved Seller could directly change an owned Store's `status` and could create a Store row with `status='approved'`, bypassing Staff approval.
- Canonical Seller Settings uses `velora_update_seller_profile` for safe profile fields; Store status is intentionally managed by Staff RPCs.
- Commit `324676024c31e7bfbd0a082d37c81d4ee29d76b5` added a BEFORE INSERT/UPDATE Store guard. Non-staff Sellers can no longer change Store status or owner; Seller-created Stores are forced to `pending`. Staff status-management RPCs remain allowed.
- Restore-Test DB proof: status mutation returned `STATUS_CHANGE_REQUIRES_STAFF`; Seller direct insert with requested approved status was normalized to `pending`; ordinary profile-field update still succeeded.
- Exact Vercel deployment `dpl_2uZDH7rxoxE1Toyks9qyy73qW1Rg` is READY on commit `324676...`; all associated browser/source/security gates completed SUCCESS.

### Support-case insert hardening — CLOSED at DB + CI/deployment level
- DB probe showed a normal customer could directly insert a support case as `resolved`, assign `owner_user_id` to self, and set `owner_role`, while the canonical `velora_create_support_case` contract does not expose those fields.
- Commit `261f935f40e31cfbccc8760f96edc73c9fe57873` added a BEFORE INSERT guard for non-staff cases. It validates case type/priority/subject/order access and forces lifecycle-controlled fields to `open`, unassigned, unresolved, with the canonical SLA window.
- Restore-Test DB proof: a valid case on the authenticated customer's own order was normalized to `open` with no owner; a case linked to another customer's order was rejected with `ORDER_ACCESS_DENIED`.
- Exact Vercel deployment `dpl_CRUtcLRpmDaS7uy2Z479LaMohXAV` is READY on commit `261f935...`; its browser gates completed SUCCESS. Seller/customer UI proof remains separate from backend proof.

### Transaction-message participant hardening — CLOSED at DB + CI/deployment level
- DB probe showed a Seller could directly create a transaction message for an Order in the Seller's portfolio while assigning a different customer's `customer_id`; the RLS model would expose the row by `customer_id` even though the canonical send RPC derives the participants from the Order.
- Commit `f8808dbdcf940696b1e6ea5201cc1ae7c2b9d2ee` added a BEFORE INSERT participant guard. Customer messages require the authenticated customer to own the Order; Seller messages require the authenticated Seller to be an actual Order participant and bind `customer_id` to the Order customer.
- Restore-Test DB proof: cross-customer Seller injection was rejected with `ORDER_CUSTOMER_MISMATCH`; valid Seller and valid Customer message inserts both succeeded inside rollback-only probes.
- Exact Vercel deployment `dpl_BfUuZuV1XdxUEeEoqhVmr6hK6CL5` is READY with exact Git SHA `f8808...`.
- Exact commit `f8808...` gates: Source + Security SUCCESS; Dependency + Web Surface SUCCESS; Authenticated Browser SUCCESS; Local Source Browser SUCCESS; Staff Launch SUCCESS; Vercel Preview Comments SUCCESS.

### Shipping upsert ownership hardening — CLOSED at DB + CI/deployment level
- DB probe exposed a real cross-store mutation path in both shipping upsert RPCs: a Seller could reuse an existing foreign `p_zone_id` or `p_rate_id` while supplying an owned parent context, allowing the `ON CONFLICT(id) DO UPDATE` path to modify another Store's shipping record.
- Commit `137ca7217a13dc122dcf93750095cdf559625450` added ownership-binding checks: existing Zone IDs must belong to the supplied Store; existing Rate IDs must belong to the supplied Zone.
- Restore-Test DB proof: foreign Zone mutation returned `FORBIDDEN`; foreign Rate mutation returned `FORBIDDEN`; valid updates on the Seller's own Zone/Rate continued to succeed.
- Exact Vercel/CI proof should be recorded against the commit once its final gates complete; no Production change was made.

### Order / Payment mutation boundary — CLOSED / VERIFIED
- Direct authenticated mutation probes against `orders` and `order_items` are blocked at the table-permission/RLS boundary; customers do not have direct INSERT/UPDATE policy access to those tables.
- Direct `payments` and `payment_attempts` updates do not have authenticated mutation policies. A customer-owned Payment row and a foreign Payment row were both non-modifiable through direct authenticated UPDATE probes; provider/payment state remains RPC/webhook controlled.
- Canonical `velora_create_order` re-reads product, Seller, variant, price, stock, FX, and server shipping quote inside the transaction before inserting order lines and decrementing stock. This preserves the intended trust boundary even if cart state is manipulated locally.
- `velora_set_order_payment_method` and provider-session attachment RPCs require authenticated ownership of the Payment/Order context. No new checkout or payment architecture was introduced.

### Stage A security sweep status — 2026-09-28
- Seller Store lifecycle, Support Case insert lifecycle, Transaction Message participants, Shipping Zone/Rate ownership, and Seller Product ownership/capacity all have concrete DB probes showing the previously identified bypasses are now rejected.
- Promotions, Coupons, Gift Cards, Seller Subscriptions, Orders, Order Items, Payments, and Payment Attempts were checked for direct authenticated writes; no new reproducible bypass remains in these surfaces.
- The only remaining Security Advisor concern is the known broad RPC EXECUTE surface; the dedicated attack-surface audit still reports `unguarded_public_dml=0`, so no blanket privilege revocation is justified.
- The exact branch-head documentation commit `236882cb20114ef4c5df3bc66dee41539e2a8270` has all CI gates **SUCCESS** and its exact Vercel Preview `dpl_CT4Qf5SiCuvpvycf7koNrWSYP4vo` is **READY**.
- Shipping hardening commit `137ca721...` had its Source/Dependency runs superseded/cancelled by the branch-head run; the branch-head run on `236...` is the authoritative combined CI evidence for the full tree.

### Profile account lifecycle hardening — CLOSED at DB + CI/deployment level
- A real self-reactivation path was observed: an authenticated user could change their own `profiles.status`, and `velora_ensure_own_profile()` also forced existing profiles back to `active`.
- Commit `74fb52c15c07a9cabcd7b885d875c4b9f23c1e19` added a BEFORE UPDATE guard so non-staff users cannot change `profiles.status`; Staff account actions remain allowed.
- The same patch changed `velora_ensure_own_profile()` to preserve an existing lifecycle status instead of reactivating a suspended/blocked profile.
- Restore-Test proof: Staff suspension produced `suspended`; profile hydration preserved `suspended`; customer self-reactivation returned `PROFILE_STATUS_CHANGE_REQUIRES_STAFF`; Staff restore returned `active`.
- Exact Vercel Preview `dpl_C7ZHfVoY12R2Xi6Lhzntu3Vkvz5W` is READY. Its Source/Dependency checks were superseded by the later combined branch-head run; all latest branch-head gates are SUCCESS.

### Beauty Feedback moderation-attribution hardening — CLOSED at DB + CI/deployment level
- Direct customer INSERT could previously forge `moderation_status`, `moderation_note`, `moderated_by`, and `moderated_at` despite the canonical submission RPC controlling these fields.
- Commit `ee83420ee96c49e2535442af0b53447c9cc3cb31` added a BEFORE INSERT guard for non-staff feedback rows. Customer submissions remain auto-approved to match the existing canonical submission contract, while moderation attribution fields are forced null until a Staff moderation operation exists.
- Restore-Test proof: forged metadata was normalized to `moderation_status='approved'` with `moderation_note/moderated_by/moderated_at = null`.
- Exact Vercel Preview `dpl_DoE1iuFnc4yRAVkRdQW5Ck7Q2PxR` is READY on exact SHA `ee834...`; all six branch-head CI gates completed SUCCESS.

### Account suspension semantics — OPEN POLICY / AUTHORIZATION GAP
- OBSERVED: after Staff suspended an approved Seller by setting `profiles.status='suspended'`, the Seller could still execute an owned Shipping Zone upsert because that RPC checks Store ownership but not active account status.
- This is not patched yet because the current product policy does not explicitly establish whether an account suspension should immediately disable Seller fulfillment/settings operations or allow fulfillment of existing obligations.
- Do not invent this business rule in code. When governed, implement the smallest central enforcement path and regression-test Seller, Customer, Staff, and Owner behavior.

### Current security audit result — Restore-Test
- `velora_run_security_attack_surface_audit()` completed with: RLS core `13/13 PASS`; policy coverage `30 PASS`; pinned search_path `PASS`; SECURITY DEFINER posture `PASS`; public/anon RPC surface `WARN` because 22 RPCs are executable by anon, but the audit reported `unguarded_public_dml=0`.
- This is a posture warning, not evidence to blanket-revoke SECURITY DEFINER functions. Existing actor/ownership checks remain the governing pattern.

### Security Advisor
- Restore-Test Security Advisor still reports the previously known categories: RLS-enabled tables without policies, pg_net in public, 6 anon SECURITY DEFINER execute warnings, 202 authenticated SECURITY DEFINER execute warnings, and leaked-password protection disabled.
- These are not being blanket-revoked because Velora deliberately uses SECURITY DEFINER RPCs with actor/ownership checks. No Production change was made.
- The new Seller product guard was tested directly at DB level and is now part of the migration history.

### Next unresolved items
1. Seller UI Browser proof — PENDING, blocked by absence of Seller credentials in the browser-gate harness. Do not fake this proof.
2. Returns/Refunds — BLOCKED on business/legal commercial rules; existing backend remains audited and no new workflow should be invented.
3. Support-case operational/browser proof — PENDING only if a real existing customer UI/fixture path is identified; the backend insert and owner-field protections are now DB-verified.
4. Continue Stage A from the next reproducible gap. The latest branch-head CI is SUCCESS and the exact Preview is READY; no extra manual test is required before moving on. Do not reopen already verified Product Detail, Related Products, Store Navigation, Shipping, Notifications, or cart architecture without new evidence.
## Where we are
Stage A — Commerce Discovery / Hardening. Production is **FROZEN**. Work is on `audit/full-gate-2026-09-25` and Restore-Test only.

**Latest application/runtime/security commit:** `f8808dbdcf940696b1e6ea5201cc1ae7c2b9d2ee` (`fix(security): bind transaction messages to order participants`). The same branch also contains the Store, Support Case, and Shipping ownership hardening migrations documented above.

**Current branch HEAD:** `ee83420ee96c49e2535442af0b53447c9cc3cb31` (`fix(security): protect feedback moderation attribution`).

**Latest deployed Preview:** Vercel deployment `dpl_DoE1iuFnc4yRAVkRdQW5Ck7Q2PxR`, READY, exact Git SHA `ee83420ee96c49e2535442af0b53447c9cc3cb31`.

## Latest authoritative gate state — 2026-09-28

### CI — current branch HEAD `857d1cad...`
- **Velora Local Source Browser Gate #34** — run `36350826053` — **SUCCESS**. This is exact checked-out source/runtime evidence on `857d...`.
- **Velora Authenticated Browser Gate #124** — run `36350826137` — **SUCCESS**. The workflow is configured against the branch alias; because the alias currently resolves to deployed SHA `8c921...`, the run is browser evidence against the current deployed application source tree but **not exact-SHA `857d...` deployment evidence**.
- **Velora Staff Launch Gate Audit #121** — run `36350826122` — **SUCCESS**. The audit RPCs succeeded, but the workflow's configured Preview URL/tested SHA are historical; treat this as launch-gate logic evidence, not current Preview-source proof.
- **Velora Full Audit Gate #271** — run `36350826097` — **SUCCESS**.
  - Source + Security: **SUCCESS** — CodeQL, JavaScript syntax, static audit, script-manifest consistency, Semgrep, Gitleaks.
  - Dependency + Web Surface: **SUCCESS** — root/src dependency audits, Lighthouse, OWASP ZAP baseline.


### 2026-09-28 batch gate status — exact commit `ee834...`
- Local Source Browser Gate: **SUCCESS**.
- Authenticated Browser Gate: **SUCCESS**.
- Staff Launch Gate: **SUCCESS**.
- Dependency + Web Surface: **SUCCESS**.
- Source + Security: **SUCCESS**.
- Vercel Preview Comments: **SUCCESS**.
- Exact Preview: `dpl_DoE1iuFnc4yRAVkRdQW5Ck7Q2PxR`, READY, Git SHA `ee834...`.
- Restore-Test contains the newly applied Store, Support Case, Transaction Message, and Shipping ownership guards. Production remains **FROZEN**.

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
