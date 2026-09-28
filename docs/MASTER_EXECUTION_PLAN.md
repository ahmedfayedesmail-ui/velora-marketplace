# VELORA — MASTER EXECUTION PLAN / ONE SOURCE OF TRUTH

Status: ACTIVE
Execution model: continuous platform audit + hardening + automation + governance + readiness
Environment policy: Restore-Test only for current work; Production is frozen.

## 0. Non-negotiable operating rules

### Rule 1 — Complete master execution
This file is the single continuous execution track. Nothing is silently dropped when work moves between tracks, phases, waves, or messages. Open, blocked, pending, not-evidenced, security, RBAC, owner-governance, payments/provider, legal, backup/rollback, browser/provider evidence, and cross-system items remain tracked until explicitly closed.

### Rule 2 — Research first / reuse first / build only when needed
Sequence:
Existing Contract -> Research -> Observed Gap -> Actual Need -> Smallest Safe Change

Do not create duplicate systems, engines, RPCs, business logic, or speculative schema. Do not build merely for the sake of building. Prefer proven prior art and patterns that fit Velora. Existing canonical paths remain authoritative.

### Rule 3 — Action Flow runs in parallel
Every material workflow is evaluated as:
EVENT -> GUARD/AUTHORIZATION -> VALIDATION -> STATE TRANSITION -> AUTOMATIC SIDE EFFECT -> NEXT EVENT -> AUDIT -> RETRY/IDEMPOTENCY/DEDUPE -> HUMAN EXCEPTION

Normal paths should be end-to-end automatic. Owner/Staff intervention is reserved for seller approval, legal publication, fraud decisions, exceptional refunds, suspension, irreversible governance, provider ambiguity, and release control.

## 1. Project identity

Product: Velora Marketplace
Vision: Beauty-first Marketplace / Personal Beauty Operating System

## 2. Business model / positioning

- Multi-vendor marketplace
- Beauty-first
- Commission model
- Seller subscriptions
- Seller advertising
- COD support
- Arabic-first
- Beauty Passport
- Routine discovery
- Deterministic personalization
- Product intelligence
- Routine -> Cart

## 3. Complete platform model

Customer:
Account -> Beauty Passport -> Current Context -> Routine -> Recommendations -> Product -> Cart -> Checkout -> Payment -> Order -> Fulfillment -> Outcome -> Feedback -> Replenishment -> Future personalization

Seller:
Onboarding -> Store -> Product creation -> Moderation -> Lifecycle -> Inventory -> Orders -> Shipping -> Subscription -> Advertising -> Earnings -> Commission -> Payout

Owner/Governance:
Users -> Sellers -> Product moderation -> Orders -> Payments -> Refund exceptions -> Subscriptions -> Advertising -> Commissions -> Payout governance -> Promotions -> Gift Cards -> Legal -> Fraud/Trust -> Suspension -> Audit -> Reconciliation -> Launch control

## 4. Technical baseline

Repository: ahmedfayedesmail-ui/velora-marketplace
Current audited continuation branch: audit/runtime-parity-2026-09-28
Current observed branch HEAD: f4529d30a7fb48576ce08b1e4fc8979345655e13
Current HEAD commit message: fix: harden Beauty Passport V2 value contract

Historical branch supplied in an earlier handoff:
audit/full-gate-2026-09-25
Its current observed HEAD is 6391ee605fdf8936f0e3d26f89319f80bc9ce582.
Do not roll back to historical SHAs merely because they appear in older handoff text.

## 5. Supabase

Production:
name: maha-beauty
ref: cogplqokzxqaedvjxbwu
region: eu-central-1
status at baseline verification: ACTIVE_HEALTHY
Policy: FROZEN — DO NOT MODIFY during audit/hardening.

Restore-Test:
name: velora-restore-test
ref: arlaxqmhtvjwjbjinjfw
region: eu-central-1
status at baseline verification: ACTIVE_HEALTHY
Use this environment for current testing and controlled schema/function changes.

## 6. Vercel

Project ID: prj_cDGSF8k6DPAOwZduQl1UG9ZZOKVY
Team ID: team_OVPYuZ9zuxZDGlCxgNq0FQ2i
Root Directory: src

Known earlier READY deployment references from historical evidence must remain historical unless re-verified. Current branch-to-current-preview parity is not assumed without deployment and browser evidence.

## 7. CI / audit evidence

Historical CI successes do not automatically prove current Preview, Browser, Provider, or Production state.

Required distinctions:
- source/CI success
- Preview availability
- Browser behavior
- provider settlement/webhook evidence
- production infrastructure
- backup/rollback proof

Never collapse them into one PASS.

## 8. Evidence hierarchy

L1 Source
L2 DB
L3 Contract / ACL / RLS
L4 Negative Path
L5 CI
L6 Preview
L7 Browser
L8 Provider
L9 Production

Never promote lower-level evidence into a higher-level PASS.

## 9. Status language

CLOSED-DONE
OPEN
BLOCKED
PENDING
NOT EVIDENCED
INFERRED
HYPOTHESIS

Every conclusion should use one of these classifications where applicable.

## 10. Safety / authority guardrails

- Production remains frozen.
- Existing canonical business logic is the source of truth.
- No duplicate engine when a canonical engine exists.
- No speculative schema mutation.
- No fake feature claims.
- No claim of Browser PASS without Browser evidence.
- No claim of live provider settlement PASS without provider evidence.
- No SQL happy-path simulation presented as Browser/Production proof.
- Owner/Staff-only governance stays explicit.
- Human exceptions are deliberate, auditable, and minimal.

## 11. Continuous execution requirement

All future Master Handoff messages extend this same file/track. They must be reconciled into the same execution model; no parallel “Part B” becomes the operative source of truth.

For each new work package:
1. Preserve all prior open/blocked/pending/not-evidenced items.
2. Inspect the actual current source and DB state.
3. Research before deciding to build.
4. Reuse canonical paths where possible.
5. Implement the smallest justified change.
6. Verify source + DB/ACL/negative paths.
7. Deploy Preview when code changed.
8. Run Browser Gate where behavior changed.
9. Record evidence and classification.
10. Carry unresolved items forward explicitly.

## 12. Message execution rule

Messages 1/11 through 11/11 are treated as execution work packages, not passive notes. A message is not considered complete merely because its requirements have been written down; it is complete only when the applicable implementation and evidence gates are satisfied or the item is explicitly classified as OPEN/BLOCKED/PENDING/NOT EVIDENCED with the reason and next required evidence.



# Execution Ledger — Message 2/11 and Message 3/11

## Message 2/11 — Core Marketplace

CLOSED-DONE:
- Canonical server cart and canonical Routine -> Cart adapter retained; no cart rewrite and no duplicate cart engine.
- Canonical checkout retained in src/scripts/13-payments.js with compatibility delegation only in 57-s2-checkout-e2e.js.
- Checkout idempotency uses the existing stable checkout reference and in-flight submit guard.
- Shipping uses the current store_shipping_zones/store_shipping_rates contract and velora_manual.
- Current Restore-Test shipping fixture: Egypt — E2E Test Zone / EG / 30 EGP / 2–5 days.
- Variant inventory contract exists: selected variant and parent aggregate stock are reconciled.
- Payment failure trigger releases inventory, reverses pending commissions, fails payment, cancels the order, and audits the event.
- A rolled-back DB negative-path test on Order 68 verified pending/pending + stock 13 -> cancelled/failed + stock 14, then rollback restored the original state.
- The historical order_items.status bug is not present in the current order_items contract; no status column was added.

OPEN / NOT EVIDENCED:
- Legacy local checkout shipping display formula remains untouched until a current user-visible regression is reproduced.
- Active variant Browser runtime is not evidenced because Restore-Test currently has zero active variants.
- Browser / Provider / Production evidence remains separate gates.

## Message 3/11 — Product Lifecycle + Seller Products + Cross-System

CLOSED-DONE:
- Product lifecycle enum verified as pending / approved / rejected / inactive.
- Current code now uses canonical seller product RPCs for create/update/stock:
  velora_seller_create_product_full
  velora_seller_update_product_full
  velora_seller_update_product
- Seller availability UI now uses velora_seller_set_product_availability with approved <-> inactive actions.
- Seller hard-delete UI was removed from the canonical Seller Products screen.
- Restore-Test seller hard-delete contract was closed by migration 20260928132247_enforce_seller_product_lifecycle_no_delete.sql: DELETE policy dropped and DELETE privilege revoked for authenticated/anon.
- Canonical seller RPC ACL verified: anon=false, authenticated=true, service_role=true.
- Direct authenticated table DML on products is not permitted; current code path no longer uses direct product insert/update/delete for Seller Product operations.
- Existing product status notification architecture is retained.
- Product lifecycle authority remains staff-governed for status transitions.
- Ads visibility function enforces campaign timing, approved product/seller/store, active package, and current positive inventory.
- Temporary transaction test proved an active ad is visible with stock available and becomes invisible when the product is changed to OOS; transaction rolled back and no campaign data persisted.
- Existing order-item product snapshots and purchase-linked beauty feedback remain separate historical context; no lifecycle delete cascade was introduced.

PRODUCT IMAGES — RESEARCH COMPLETED:
- Supabase current documentation confirms Storage uploads require Storage RLS policies and recommends treating storage schema metadata as read-only and using the Storage API for file operations. citeturn238850search1turn238850search13
- Medusa's current architecture similarly separates file upload/storage from product image URL persistence; product records store image URLs after the file upload layer provides them. citeturn238850search2turn238850search4
- Shopify's current documentation describes CDN-hosted MediaImage objects for product media. citeturn238850search14
- Velora currently has zero Storage buckets and zero product_images rows, while the canonical full seller-product RPC already accepts an HTTPS image URL into products.images.
- Decision: do not invent a new image service, Base64 scheme, or parallel media engine. Keep the existing HTTPS URL contract as the smallest current path. A real upload/storage implementation remains a later justified change only when an actual storage/upload requirement and ACL contract are established.

BROWSER GATE:
- A current Preview deployment exists for the exact post-change source commit, state READY.
- Browser verification was attempted against that Preview but the available browser automation provider was unavailable because its wallet balance was insufficient. Therefore no Browser PASS is claimed.

CLASSIFICATION:
- OBSERVED FACT: source/DB changes above exist and were verified.
- INFERRED: the Seller Products UI is now aligned with the intended lifecycle architecture.
- NOT EVIDENCED: end-to-end Browser behavior for the current commit.
- NOT EVIDENCED: provider settlement or Production behavior.


## Message 4/11 — Seller Track: Status / Dashboard / Subscriptions / Ads / Commission / Payout

### 30. Seller Status
CLASSIFICATION: OPEN WITH CLOSED FOUNDATION

OBSERVED FACT:
- Seller lifecycle is server-side and seller status remains staff/owner governed; no seller self-service status mutation is being introduced.
- Current Restore-Test seller enum is pending / approved / rejected / suspended. Current count: 1 approved seller.
- Product edit-after-approval still has no explicit business rule that identifies which edits require re-review. This remains OPEN POLICY. Do not auto-reset product status without an approved policy.
- Abandoned pending-order handling remains OPEN POLICY + IMPLEMENTATION GAP. Current checkout/order creation decrements inventory immediately; no reservation/TTL table or dedicated expiry job was evidenced. Existing payment-failure inventory release remains the proven recovery path. Do not invent TTL semantics.
- The legacy public function velora_update_order_item_status(p_order_item_id,p_new_status,p_note) still exists and its current definition references v_item.status and updates public.order_items.status::order_item_status.
- Current public.order_items has NO status column. Current enum inspection also did not show order_item_status. The function therefore remains a broken legacy contract unless/until the business contract is explicitly decided.
- A direct SQL execution probe of that function from the unauthenticated DB tool stopped at its AUTH_REQUIRED guard, so the missing-column failure was not executed in that probe. Source + schema inspection independently establishes the contract mismatch. Do not add order_items.status casually.

INFERRED:
- The order-item status function is legacy/dead or drifted relative to the canonical current order/status model, but this is not yet a business-policy conclusion.
- Pending-order abandonment cannot be safely closed by choosing an arbitrary timeout; the correct behavior depends on inventory reservation and payment policy.

REQUIRED NEXT EVIDENCE:
- business decision for post-approval product re-review
- business/operations decision for abandoned pending orders and reservation semantics
- decision whether order item status is a supported contract, deprecated compatibility function, or replaced by shipment/order-level status

### 31. Seller Dashboard Re-entry Bug
CLASSIFICATION: OPEN / NOT EVIDENCED

OBSERVED FACT:
- The historical user journey remains: Seller Dashboard -> leave -> re-entry fails -> refresh makes it work.
- Current source inspection does NOT reproduce the previous hypothesis that the router captures the legacy seller opener.
- Current src/scripts/12-localization.js explicitly assigns window.openSellerPlatform=openCanonicalSeller.
- Current src/scripts/63-platform-router.js captures window.openSellerPlatform after that canonical assignment in the known script order, so its originalOpenSeller currently resolves to the canonical seller opener.
- 63-platform-router.js still owns hash route activation, returnHash, close/reopen sequencing, hashchange/popstate sync, and an initial auth wait loop. These are investigation targets, not proven root causes.
- Browser reproduction is still unavailable. Do not classify source inspection, Preview readiness, or SQL as Browser PASS.
- Do not blame browser cache, rewrite routing blindly, add MutationObserver, or add arbitrary listeners.

HISTORICAL HYPOTHESIS STATUS:
- Previous hypothesis "63-platform-router captures legacy seller opener" is SUPERSEDED/INVALIDATED by current source inspection.
- The user-visible bug itself remains OPEN until Browser evidence identifies the exact failure path.

ACTION FLOW:
Detect route/re-entry failure -> verify current hash/auth/session state -> execute canonical seller activation -> verify visible seller shell/auth -> recover by controlled route re-sync or escalate only when session/auth is genuinely missing.
No new routing engine.

### 32. Seller Subscriptions
CLASSIFICATION: PARTIALLY CLOSED FOUNDATION / OPEN RUNTIME + COMMERCIAL POLICY

OBSERVED FACT:
- Current Restore-Test counts: seller_subscriptions=0; seller_subscription_renewal_jobs=0; subscription payment attempts=0. Therefore no persistent subscription runtime proof exists.
- Current subscription foundation includes:
  velora_start_subscription_purchase
  velora_resolve_subscription_price
  velora_sync_subscription_state
  velora_run_renewal_batch
  velora_create_subscription_renewal_payment_attempt_internal
  velora_record_renewal_result
  velora_mark_subscription_payment_initialization_failed
  velora_schedule_subscription_expiry_notification_jobs
- Purchase requires authenticated approved seller/store, store-country match, active plan, legal acceptance for seller agreement/subscription/commission, canonical regional price resolution, card payment method, idempotency, and pending state with pending_expires_at.
- Subscription state sync covers pending capture -> active, pending expiry -> cancelled, active expiry -> past_due when uncaptured, past_due capture -> active, and past_due grace expiry -> expired.
- Renewal batching uses queued/in_progress/failed retry work with leases and a capped attempt count; internal payment-attempt creation is service-role controlled.
- Current subscription payment-initialization failure helper fails the payment attempt, can expire a pending subscription, calls canonical state sync, and audits.
- Country/currency binding is enforced against the canonical store country.
- No dedicated cancel / upgrade / downgrade / replacement seller-subscription RPC was found in the current public function inventory.
- Existing notification/action-flow infrastructure already includes seller subscription lifecycle/expiry processing through the canonical notification lifecycle. Current cron evidence has one active job: velora-notification-lifecycle, every minute, executing velora_process_notification_lifecycle(100). Do not add another scheduler for the same lifecycle.
- Current code does not expose subscription-management UI in src/scripts/12-localization.js; the canonical Seller Center currently covers dashboard/products/inventory/orders/settings only.

OPEN:
- cancel semantics
- upgrade/downgrade semantics
- replacement semantics
- proration/deferral/refund policy
- entitlement application and removal
- provider charge/capture evidence
- browser runtime evidence
- failure/recovery evidence beyond source/DB contracts
- notification delivery/browser evidence

RESEARCH:
- Shopify's current subscription documentation shows that subscription changes can involve replacement semantics, with cancellation/replacement and potential proration/deferral behavior. This reinforces the requirement for explicit Velora policy before implementing cancel/upgrade/downgrade/replacement rather than guessing semantics. (Research source captured during Message 4 web review.)
- No new subscription engine should be built; existing canonical state machine remains authoritative.

ACTION FLOW:
Detect renewal/expiry/payment result -> validate subscription/payment binding -> sync state -> create retry job or activate/expire -> schedule/cancel notifications -> audit -> retry/escalate provider ambiguity.
Human input only for explicit commercial policy and provider/governance exceptions.

### 33. Subscription Entitlements
CLASSIFICATION: PARTIAL / OPEN FEATURE POLICY

OBSERVED FACT:
- Current subscription_plans has exactly four active plans: Free, Basic, Pro, Enterprise.
- Numeric contract currently is:
  Free: USD 0 monthly / 0 yearly, commission 12.5%, max_products 25
  Basic: USD 9.99 / 99.99, commission 10%, max_products 250
  Pro: USD 29.99 / 299.99, commission 7.5%, max_products 2500
  Enterprise: USD 99.99 / 999.99, commission 5%, max_products NULL (unlimited in current numeric contract).
- Current plans all have features = {}. Therefore no named feature-entitlement matrix is currently contractually populated in Restore-Test.
- regional_pricing exists and currently has active EG rows:
  Free 0/0 EGP
  Basic 199/1990 EGP
  Pro 499/4990 EGP
  Enterprise 1499/14990 EGP
  with additional regional rows for AE/BH/JO/KW/MA/OM/QA/SA and inactive ZZ fallback data.
- Do not copy the stale legacy SELLER_PLANS values from 00-localization.js into the canonical business model. That legacy object currently contains materially different prices, commissions, product limits, and ad-feature claims.

OPEN:
- business-approved feature entitlements
- whether ads/analytics/support/placement/etc. are true plan entitlements
- effective-date/versioning policy for entitlements
- UI presentation of plans using canonical DB values
- whether and how a plan change affects existing products, ads, commission rate, and seller access

RESEARCH-FIRST DECISION:
- No feature build is justified while the canonical features object is empty and business entitlements are unspecified.
- Keep numeric and regional pricing contracts as current observed DB state; do not invent a new plan matrix.

### 34. Seller Advertising
CLASSIFICATION: FOUNDATION CLOSED / PAYMENT SETTLEMENT + ANALYTICS OPEN

OBSERVED FACT:
- Current active ad packages:
  product_boost_3d = 99 EGP / 3 days / shop_sponsored
  featured_product_7d = 199 EGP / 7 days / shop_sponsored
  home_spotlight_7d = 499 EGP / 7 days / home_spotlight
- These prices remain PROVISIONAL and NOT MARKET VALIDATED.
- velora_start_seller_ad_purchase is the canonical purchase path. It requires approved seller/store, Egypt country alignment, legal acceptance, active EGP package, approved seller-owned product, idempotency, and creates a pending_payment campaign plus canonical seller-ad payment attempt.
- velora_sync_seller_ad_campaign handles pending_payment capture/failure/refund, activation, product approval guard, duration expiry -> completed, auditing, and seller notifications.
- velora_process_seller_ad_lifecycle expires active campaigns and delegates to the canonical sync function.
- Existing notification lifecycle infrastructure is sufficient to run this automatically; no second scheduler or ad engine is justified.
- Current seller_ad_campaigns=0 and seller-ad payment attempts=0, so no persistent runtime/capture evidence exists.
- Current architecture is fixed-price, fixed-duration packages; CPC auction / advanced targeting is NOT currently part of the proven Velora contract.

RESEARCH:
- Amazon Ads current official material confirms Sponsored Products are CPC/auction-based and reports metrics such as impressions, clicks, average CPC, cost, attributed sales and ROAS. This is useful prior art for future analytics vocabulary but does NOT establish Velora policy or justify introducing a CPC auction model now.
- Decision: preserve Velora's existing package model; do not build CPC/auction/advanced targeting merely because another marketplace uses it.

OPEN:
- live provider capture/settlement
- refund/accounting treatment
- reporting/analytics persistence and definitions
- attributed-order methodology
- seller-facing ad management UI
- market validation of package pricing

ACTION FLOW:
Detect package purchase/expiry/payment outcome -> validate package/product/store/legal -> create/attach payment attempt -> provider result -> activate/fail/refund/complete -> notify/audit -> retry/escalate provider ambiguity.

### 35. Commission
CLASSIFICATION: ENGINE CLOSED / COMMERCIAL POLICY OPEN

OBSERVED FACT:
- commissions currently contain 13 pending, 1 finalized, and 1 reversed row in Restore-Test.
- Canonical velora_get_commission_rate resolves an active non-Free paid subscription's commission rate first, otherwise seller-plan rate, otherwise the 12.5 fallback.
- Current subscription plan commission rates are 12.5 / 10 / 7.5 / 5 by Free / Basic / Pro / Enterprise.
- The 12.5 value remains an observed current fallback/default, not a user-approved final commercial policy.
- Historical legacy seller-plan UI in 00-localization.js advertises different commission values and must not be treated as canonical.

OPEN:
- final commercial commission policy
- exact fee basis (gross, discounted amount, shipping, taxes, seller-funded promotions, platform-funded promotions)
- effect of plan changes on already-created orders/commissions
- refund/chargeback treatment beyond the current reversal engine
- seller-facing presentation

No new commission engine is justified.

### 36. Payouts
CLASSIFICATION: CALCULATION / REQUEST / RECORDING CLOSED; PROVIDER SETTLEMENT OPEN

OBSERVED FACT:
- Current payout count is 0.
- Canonical velora_request_seller_payout:
  requires authenticated approved seller/store,
  prevents duplicate pending/processing payouts,
  calculates only finalized commissions for paid+delivered orders with shipment delivered at least 7 days ago,
  excludes order items already included in seller_payout_items,
  creates a pending payout plus itemized payout rows,
  and audits the request.
- Canonical velora_record_payout_execution is staff-governed; it moves pending/processing -> paid, requires method/reference, is idempotent for an already-paid matching reference, writes a conflict-safe payout ledger entry, and audits.
- Current cron inventory did not show a dedicated payout processor. This is consistent with the current contract where execution is explicit staff/provider-side action rather than an autonomous external settlement engine.
- Actual provider transfer/settlement is NOT evidenced.
- Do not equate payout eligibility, payout request, or recorded execution with money actually transferred.

ACTION FLOW:
Detect payout eligibility -> calculate/validate -> seller requests -> create pending payout -> staff/provider execution -> record execution -> ledger/audit -> reconcile or escalate provider ambiguity.
Human involvement remains necessary at the external settlement boundary unless a real provider contract is later established.

### Cross-cutting Message 4 conclusion
CLOSED-DONE / FOUNDATION:
- Seller status authority remains server-side.
- Current canonical seller route source is aligned to canonical opener; previous router-captures-legacy hypothesis is invalidated by current source.
- Subscription state/renewal/action-flow foundation exists.
- Numeric plan entitlement fields and regional pricing are verified.
- Seller ad package/purchase/state/action-flow foundation exists.
- Commission calculation engine exists.
- Payout eligibility/request/execution-recording foundation exists.

OPEN / NOT EVIDENCED:
- Seller dashboard Browser reproduction.
- Post-approval product re-review policy.
- Pending-order reservation/abandonment policy and implementation.
- Order-item status contract decision; current legacy function is incompatible with current order_items schema.
- Subscription cancel/upgrade/downgrade/replacement policy + implementation.
- Subscription feature entitlements; current features objects are empty.
- Subscription/ad provider capture and settlement.
- Seller ad reporting/attribution analytics.
- Payout provider settlement.
- Current runtime/browser proof for subscriptions, ads, and payouts.
- Stale legacy Seller Plans dependency in 00-localization.js remains an OPEN legacy-surface audit item; do not copy or silently treat it as canonical.

### Message 4 Action Flow Carry-Forward
The Action Flow continues in parallel with all later handoff messages:
Detect -> Decide -> Execute -> Verify -> Recover/Escalate.
For seller systems, automatic normal-path actions should be driven by existing canonical RPCs/jobs/triggers; human intervention remains restricted to seller approval, commercial-policy decisions, legal/provider ambiguity, refunds/exceptions, payout execution, suspension, and release control.

## Message 5/11 — Promotions / Gift Cards / Returns / Notifications

### 37. Promotions / Coupons
CLASSIFICATION: CANONICAL ENGINE CLOSED / POLICY + CONTROL-SURFACE GAPS OPEN

OBSERVED FACT:
- Restore-Test currently has 1 coupon (WELCOME20), 0 coupon_redemptions, 0 promotions, and 0 promotion_redemptions.
- WELCOME20 is currently percentage 20%, EGP, minimum order 200 EGP, maximum discount 500 EGP, global usage limit 1000, customer usage limit 1, first_order_only=true, platform-funded, active, no expiry.
- Canonical coupon validation enforces authentication, active window, currency, minimum subtotal, global/customer usage limits, first-order-only, and percentage/fixed calculation with maximum discount cap.
- Canonical coupon application is customer-owned-order locked, idempotent per coupon/order, records redemption, increments used_count, recalculates order total, and audits.
- Canonical automatic promotion selection enforces active window, currency, global scope, minimum order and usage limits, then chooses by priority/creation order. It does not stack multiple promotions.
- Canonical promotion creation and activation are Staff/Owner governed through RPCs and auditable. Creation supports percentage/fixed only and hard-sets stackable=false.
- The DB coupons constraint still permits discount_type='free_shipping', while canonical coupon validate/apply reject unsupported types. This is a real contract mismatch and remains OPEN pending business decision; do not silently implement free-shipping semantics or remove the allowed type without policy.
- Coupon/promotion creation from the current canonical Admin Center was not previously exposed. The smallest justified UI change was to surface the existing control planes rather than build a new engine.
- Current canonical checkout integrates exactly one coupon OR the automatic best promotion, followed by an optional gift card as tender.
- Negative-path DB probes verified WELCOME20 below minimum -> COUPON_MINIMUM_ORDER_NOT_MET, wrong currency -> COUPON_CURRENCY_MISMATCH, no active automatic promotion -> no promotion applied, and unauthorised promotion creation -> STAFF_ONLY.
- No seller-owned coupon/promotion creation contract is currently evidenced. Current promotion scope is global.

OPEN:
- free_shipping contract decision
- whether stacking/combination policy should ever change from current non-stackable MVP
- exact promotion targeting policy beyond current global scope
- seller-funded vs platform-funded coupon economics
- reversal/refund treatment of coupon/promotion redemptions
- abuse/rate-limit strategy beyond current usage/customer limits
- coupon writer/management semantics if business requires changing the existing single WELCOME20 record

### 38. Gift Cards
CLASSIFICATION: SERVER FOUNDATION CLOSED / REFUND ACCOUNTING + RUNTIME EVIDENCE OPEN

OBSERVED FACT:
- Current Restore-Test gift_cards=0 and gift_card_transactions=0 after rollback.
- velora_issue_gift_card is explicitly OWNER_ONLY, requires positive amount, active currency, future expiry if supplied, unique code, creates active card and issue transaction, and writes an audit record.
- Gift-card constraints enforce initial_amount > 0, balance between 0 and initial, allowed statuses active/exhausted/expired/disabled, unique code, and restricted deletion.
- velora_quote_gift_card supports partial balance application.
- velora_apply_gift_card_to_order locks the customer order and gift card, protects against duplicate redemption, validates active/expiry/currency, applies up to remaining order total, can make the order paid when fully covered, writes a redeem transaction with idempotency key, updates card balance/status, creates a gift-card payment record, and audits.
- No separate function was evidenced that automatically credits/reverses a gift card when an order is cancelled/refunded. Refund/cancellation-to-gift-card interaction is therefore OPEN.
- No dedicated gift-card expiry scheduler was evidenced; expired cards are detected during use and marked expired on that path.
- There is no independent gift-card ledger engine; current architecture uses gift_card_transactions plus the canonical payments row for an order fully/partially covered by gift card.
- The smallest justified UI hardening was to expose the existing gift-card control plane in the canonical Admin Center and enforce an explicit Owner-role gate before rendering it. The underlying Owner-only RPC remains authoritative.

OPEN:
- gift-card refund/cancellation credit policy
- accounting/reconciliation policy
- expiry lifecycle policy beyond on-use expiry detection
- issuance amount business limits beyond >0
- fraud/abuse controls beyond unique codes, ownership and transaction idempotency
- Browser/runtime evidence

### 39. Customer Returns
CLASSIFICATION: BACKEND FOUNDATION CLOSED / CUSTOMER UX + REFUND ACCOUNTING POLICY OPEN

OBSERVED FACT:
- Current returns=0 and return_items=0.
- velora_request_return is already split-aware by store and item: customer ownership, delivered order, settled payment, valid store membership, per-item delivery proof, quantity validation, duplicate-return protection, per-line refund calculation, and audit.
- Current returns status contract is requested / approved / rejected / in_transit / received / refunded / cancelled.
- return_items protects order-item ownership via foreign keys and unique(return_id,order_item_id).
- Current velora_resolve_return has two overloaded signatures with incompatible contracts:
  1. legacy (uuid,text,text) allows requested/approved/rejected/received/refunded/closed without transition validation.
  2. transition-aware (uuid,text,text,text,text,text) allows requested/approved/rejected/in_transit/received/refunded/cancelled, validates transitions, and requires refund evidence when moving to refunded.
- Canonical Trust & Compliance UI in src/scripts/70-s1-d-trust-operations.js uses the transition-aware 6-argument resolver.
- No automatic provider refund call was evidenced; the resolver records external refund evidence/reference.
- Current partial-return refund calculation is unit_price * returned quantity and does not show explicit allocation of order-level coupon/promotion discount. This is an OPEN business/accounting policy gap.
- No return-window enforcement is currently evidenced in the request function.
- No new customer return UI was built in Message 5; the correct next step remains research + policy before any UX/contract expansion.

RESEARCH-FIRST:
- Prior-art review indicates modern commerce systems treat return eligibility, return state, and refund processing as related but distinct workflows. This supports retaining Velora's existing split-aware contract and avoiding a second return engine.

OPEN:
- return window
- discount allocation on partial returns
- shipping/tax refund policy
- restocking policy
- seller/customer vs staff resolution authority
- actual refund provider integration
- legacy 3-argument resolver retirement/compatibility decision
- customer-facing return UX

### 40. Notifications / Push
CLASSIFICATION: ARCHITECTURE CLOSED / BROWSER DELIVERY EVIDENCE OPEN

OBSERVED FACT:
- Current Restore-Test has 38 notifications, 6 push-delivery records with delivered_at timestamps, and 3 push subscriptions (1 active, 2 inactive).
- All notification/push/lifecycle tables have RLS enabled.
- src/scripts/55-s2e-notifications.js is the authoritative public notification UI; it reads through canonical RPCs and does not treat localStorage as notification truth.
- src/scripts/68-s1-d-mobile-push.js requires authenticated user/browser permission, registers /sw.js, subscribes through the existing VAPID key, persists via velora_register_push_subscription, and unregisters through the matching RPC.
- trg_velora_notification_push_dispatch invokes the existing private push dispatcher on notification insert. The dispatcher calls the existing velora-dispatch-notification Edge Function using the internal secret.
- Notification lifecycle processing is handled by the existing canonical lifecycle function and one active cron job: velora-notification-lifecycle / * * * * * / velora_process_notification_lifecycle(100).
- No second notification engine, scheduler framework, or ad-hoc cron was added.
- Endpoint ownership is protected by the hardened push-subscription contract.
- Browser push end-to-end PASS is still NOT EVIDENCED.

OPEN:
- Browser proof of notification bell/read state
- Browser proof of push enable/disable and actual device delivery
- provider/service-worker delivery edge cases
- stale subscription cleanup is implemented in the dispatcher but full browser evidence is pending

### Message 5 implementation actually made
OBSERVED FACT:
- src/scripts/12-localization.js now exposes the existing commercial control planes in the canonical Admin Center: Promotions, Coupons, Gift Cards.
- Gift Cards are explicitly Owner-gated before the existing issue/list UI is rendered.
- These controls reuse existing RPCs and existing legacy rendering functions; no second promotion, coupon or gift-card engine was created.
- Commit: 81096861caf5d09de87f1ed751d0668ff0432ee2.
- Vercel created a READY Preview deployment for exactly this commit: deployment dpl_C1PCNHCU2pdtijx5mTMmxiznJFZT, URL https://velora-marketplace-8rgtwyi3m-ahmedconccc-7063.vercel.app.
- Preview HTTP fetch returned 200 OK and served the updated deployment.
- Browser Gate was attempted against this exact deployment but could not start because the TinyFish wallet balance was -$0.07. Therefore Browser PASS is NOT claimed and the attempt is not retryable until the wallet is funded.

INFERRED:
- The canonical Admin commercial control surface is now aligned with the existing backend authority for the surfaces exposed in Message 5.
- The backend remains the source of truth for Owner/Staff authorization.

HYPOTHESIS / OPEN:
- The legacy overloaded 3-argument return resolver may be dead compatibility code, but no deletion/contract change is justified until usage and business policy are established.
- Partial-return refund allocation may require a future policy/contract change once real commercial discount behavior is confirmed.

### Message 5 Action Flow
The Action Flow remains parallel:
- Promotions: detect checkout/promotion request -> validate eligibility -> apply once -> record redemption -> audit -> later reversal/reconciliation if policy permits.
- Gift Cards: detect issuance/redeem -> Owner/customer authorization -> validate balance/expiry/currency -> lock/apply -> record transaction/payment -> audit -> exception/reconciliation.
- Returns: detect request -> validate order/store/item delivery -> create split return -> staff transition -> external refund evidence -> record refund -> audit -> reconcile/escalate.
- Notifications: detect event -> create notification -> push dispatch -> delivery/disable stale endpoint -> lifecycle job when due -> audit/recover.
No new automation framework or scheduler was introduced.


## Message 6/11 — Beauty Passport / Customer Intelligence

### 41. Beauty Passport — First-Class Track
CLASSIFICATION: CLOSED-DONE FOUNDATION / BROWSER EVIDENCE OPEN

OBSERVED FACT:
- Beauty Passport remains a first-class Customer Intelligence track and was not abandoned.
- The product model is explicitly:
  Passport = Memory / Identity
  Routine / Advisor = Current Decision
  Catalog / Cart / Orders = Commerce
  Feedback = Learning
- The intended loop remains:
  Customer <-> Beauty Profile <-> Products <-> Routine <-> Purchases <-> Outcomes <-> Time
- No parallel Passport, routine, feedback, or recommendation engine was introduced.

RESEARCH-FIRST:
- Current beauty-commerce prior art reviewed before expanding the contract includes Clinique, Sephora, Ulta, and academic skincare-recommendation work.
- The recurring useful dimensions are skin type, goals/concerns, preferences, budget/routine context, and purchase/experience signals.
- The current lightweight V2 three-question design is therefore retained rather than expanding prematurely into vision/AI or a large questionnaire.
- V2 remains intentionally narrower until an observed product need and contract mapping justify additional dimensions.

### 42-46. Current Beauty Passport V2
CLASSIFICATION: CLOSED-DONE AT SOURCE / DB / ACL; BROWSER NOT EVIDENCED

OBSERVED FACT:
- Customer-facing implementation: src/scripts/61-s1-c-quiz-v2.js.
- V2 version token: beauty-quiz.v2.
- Current questions:
  skin_type
  goal
  routine_budget
- Current frontend option tokens:
  skin_type = oily / dry / combination / normal / sensitive / unknown
  goal = brightening / hydration / acne / anti-aging / oil
  routine_budget = under_500 / 500_1000 / 1000_2000 / over_2000 / unknown
- The frontend uses the existing canonical RPC:
  velora_save_beauty_passport_v2(p_skin_type,p_goal,p_routine_budget)
- The V2 frontend is bilingual Arabic/English and mobile-oriented.
- On successful save it emits velora:passport-v2-updated and opens the existing canonical Routine UX.
- When editing the Passport, the frontend reads authoritative persisted V2 values first so unchanged answers are not silently overwritten.
- No MutationObserver was added and no separate client-side persistence engine was introduced.
- Source proof is not Browser proof.

CONTRACT HARDENING EXECUTED:
- Restore-Test V2 save RPC was hardened so goal must be one of:
  brightening / hydration / acne / anti-aging / oil
- Existing whitelist validation for skin_type and routine_budget remains enforced.
- beauty_profiles direct authenticated INSERT/UPDATE policies were hardened to require the same exact V2 token sets, preventing Data API writes from bypassing the V2 value contract.
- No new columns or questions were introduced.
- Invalid RPC probe returned SQLSTATE 22023 / INVALID_GOAL.
- Invalid direct Data API-style UPDATE probe was blocked with SQLSTATE 42501 / row-level security policy violation.
- Persisted contract scan found 0 invalid existing profiles.
- Migration file committed:
  supabase/migrations/20260928152000_harden_beauty_passport_v2_value_contract.sql
- Commit: d6a57dd5004c60f2ede656cc75fef1f5df645e47.

DOCUMENTATION TOKEN NOTE:
- The handoff text described the acne goal as acne-blemish-prone, but the actual current frontend token is acne and the existing catalog/routine vocabulary uses acne-compatible matching.
- Do not change the stored token merely to mirror a label. Keep acne as the current canonical machine token and use the user-facing label "Blemish-prone skin care".
- Revisit only if a real contract-wide rename is required and can be migrated safely.

### 47-48. Beauty Profile Data Model / Restore-Test Snapshot
CLASSIFICATION: CLOSED-DONE FOUNDATION / QA DATA NOT PRODUCTION USAGE

OBSERVED FACT:
- beauty_profiles columns currently include:
  user_id / quiz_version / goal / concern / texture_preference / effect_preference /
  avoidance_preferences / shopping_priority / updated_at / skin_type / routine_budget
- V2 save intentionally writes the V2 subset:
  quiz_version / goal / skin_type / routine_budget
- Current Restore-Test snapshot:
  beauty_profiles = 2
  v2_profiles = 2
  v1_profiles = 0
  profiles_with_concern = 0
  beauty_routine_runs = 425
  beauty_routine_steps = 2044
  beauty_recommendation_runs = 0
  beauty_recommendation_items = 0
  beauty_feedback = 2
- Earlier handoff counts of routine_runs=416 and routine_steps=1999 are historical and have been superseded by current QA data.
- Both currently observed profiles are V2; no V1 profile exists in Restore-Test.
- Routine-run volume is QA/test-driven and must not be interpreted as production usage.

### 49. V1 Beauty Passport
CLASSIFICATION: CLOSED-DONE RUNTIME RETIREMENT / FILE RETAINED FOR HISTORY

OBSERVED FACT:
- Legacy source remains at src/scripts/58-s1-b1-beauty-passport.js with beauty-quiz.v1 persistence.
- Current loaded runtime does NOT include the legacy 58 script; src/index.html loads the V2 path and not 58.
- Current branch contains:
  supabase/migrations/20260928141000_retire_v1_beauty_passport_runtime.sql
- That migration revokes authenticated EXECUTE on the legacy velora_save_beauty_profile(...) contract.
- Current V2 beauty_profiles RLS policies require quiz_version='beauty-quiz.v2'.
- The V1 file remains in repository history/source inventory, but it is not a supported runtime path.
- NON-NEGOTIABLE: never resurrect the V1 customer UX as a shortcut.
- If a remaining subsystem depends on a V1-shaped field, reconcile that dependency to V2 rather than reviving V1.

### 50-51. Beauty Recommendation Integration
CLASSIFICATION: BACKEND CONTRACT CLOSED-DONE / BROWSER + CUSTOMER UX NOT EVIDENCED

OBSERVED FACT:
- The current public recommendation RPC is:
  velora_get_beauty_recommendations()
- It now calls:
  private.velora_beauty_recommendation_operation_v2()
- Current V2 operation contract:
  reads beauty-quiz.v2 only
  requires skin_type + goal + routine_budget
  uses beauty-recommendation.v2
  fingerprints the V2 inputs with EG / EGP market context
  caches identical inputs for 24 hours
  rate-limits at 5 calls per 10 minutes per user
  requires approved EGP Beauty products with positive availability
  applies budget filtering
  incorporates the existing beauty feedback signal
  returns up to 5 results
  records runs/items using the existing beauty_recommendation_runs / beauty_recommendation_items tables
- Current backend source migration:
  supabase/migrations/20260928133000_canonical_v2_beauty_recommendation.sql
- This replaces the previous V1 recommendation dependency without reviving V1.

ACL/runtime issue found and fixed:
- Initial V2 public wrapper was callable by authenticated but ran as SECURITY INVOKER while the private V2 intelligence function had direct EXECUTE revoked.
- Authenticated runtime probe therefore failed with permission denied for private.velora_beauty_recommendation_operation_v2().
- Smallest safe fix was to make ONLY the public customer wrapper SECURITY DEFINER with an explicit auth.uid() guard; the private intelligence functions remain non-executable directly.
- Restore-Test ACL now shows:
  public.velora_get_beauty_recommendations = SECURITY DEFINER; anon execute=false; authenticated execute=true
  private.velora_beauty_recommendation_operation_v2 = SECURITY DEFINER; anon execute=false; authenticated execute=false
- Authenticated transactional runtime probe returned:
  contract_version = beauty-recommendation.v2
  status = success
  recommendation count = 5
- The test transaction was rolled back, so persistent recommendation_runs/items remain 0.
- Migration file committed:
  supabase/migrations/20260928151000_fix_beauty_recommendation_v2_public_wrapper_acl.sql
- Commit: 71877779d573b016d23c6729d875844416e61ab2.

CUSTOMER-SURFACE FINDING:
- src/scripts/59-s1-b2-beauty-recommendations.js is only a client RPC/API wrapper; it does not mount a customer recommendation presentation.
- Current source/code search found no other caller of veloraBeautyRecommendations or velora_get_beauty_recommendations in the inspected branch.
- Therefore backend recommendation integration is CLOSED-DONE, but a customer-facing Recommendation UX is NOT EVIDENCED / remains an OPEN product-surface question.
- Do not build a new recommendation UI before confirming the intended existing customer surface and researching prior art.

### 52-55. Routine
CLASSIFICATION: CLOSED-DONE FOUNDATION / BROWSER EVIDENCE OPEN

OBSERVED FACT:
- Canonical current-routine entry is velora_get_current_beauty_routine().
- It requires the V2 Passport state:
  quiz_version='beauty-quiz.v2'
  skin_type
  goal
  routine_budget
- Deterministic routine operation remains the existing private.velora_beauty_routine_operation() behind velora_generate_beauty_routine().
- Current routine fingerprint includes:
  beauty-passport.v2
  beauty-context.v2
  quiz_version
  EG / EGP
  skin_type
  goal
  concern
  routine_budget
  texture_preference
  effect_preference
  avoidance_preferences
  shopping_priority
  approved_feedback_revision
  purchase_revision
  context
- Current ruleset is beauty-rules.v5.
- Regeneration is driven by profile/context/catalog/ruleset changes.
- No second routine engine was introduced.
- Current routine output rows are labeled with contract_version='beauty-routine.v1', but this is the routine response contract name and must NOT be interpreted as the retired V1 Beauty Passport.

ROUTINE QA SNAPSHOT:
- Current Restore-Test routine runs = 425 and steps = 2044.
- Grouped current runs:
  beauty-rules.v5 = 406 complete
  beauty-rules.v2 = 17 complete
  beauty-rules.v4 = 2 complete
- Current product catalog has 5 approved, stocked EGP Beauty products used as QA fixtures.
- This is test evidence only, not production usage evidence.

### 56-58. Beauty Journey / Replenishment / Feedback
CLASSIFICATION: FOUNDATION CLOSED-DONE / BROWSER DELIVERY EVIDENCE OPEN

OBSERVED FACT:
- src/scripts/64-s1-d-beauty-journey.js uses:
  velora_get_current_beauty_routine()
  velora_get_replenishment_signals()
- Beauty Journey presents Passport memory (Skin / Goal / Budget), current routine, season/context, ruleset, routine history, and replenishment signals.
- src/scripts/65-s1-d-beauty-feedback.js uses purchase-linked feedback through velora_submit_beauty_feedback.
- Current purchase feedback is only eligible for delivered/completed customer orders with matching order item/product/variant.
- Existing private.velora_beauty_feedback_signal() returns -1 / 0 / +1 and is reused by canonical routine/recommendation logic.
- Routine input fingerprint incorporates approved feedback revision.
- Replenishment remains the canonical velora_get_replenishment_signals() engine using delivered/completed orders and deterministic product-subcategory intervals.
- No parallel replenishment, AI-feedback, or learning engine was introduced.
- Feedback, journey, and replenishment browser behavior is still NOT EVIDENCED.

### 59. Future Passport Dimensions
CLASSIFICATION: OPEN / RESEARCH-FIRST EVOLUTION POLICY

OBSERVED FACT:
- beauty_profiles already contains optional fields for concern, texture_preference, effect_preference, avoidance_preferences, shopping_priority.
- They are not currently part of the three-question V2 customer write surface.
- No new Passport dimensions were added in Message 6.

OPEN:
- whether concern should become a first-class V2 question
- sensory preference question design
- ingredient/tag avoidance model
- shopping-priority model
- how each new field would affect routine ranking
- how each new field would affect recommendation ranking
- validation, migration, privacy/UX implications
- whether the customer gets value commensurate with additional questionnaire friction

RULE:
Research -> contract mapping -> question design -> validation -> persistence -> routine impact -> recommendation impact.
No speculative field additions.

### Message 6 Action Flow — Runs in Parallel
Passport lifecycle:
Detect customer entering/editing Passport
-> authenticate
-> validate exact V2 tokens
-> save canonical profile
-> emit velora:passport-v2-updated
-> regenerate/refresh deterministic routine when needed
-> expose Recommendation V2 through the canonical public wrapper
-> use approved feedback signal when available
-> derive replenishment signals from completed purchases
-> feed future context/purchase outcomes back into the next deterministic decision
-> audit/retry/recover where the underlying canonical workflow supports it.

Normal operation should be automatic. Human intervention is limited to genuinely necessary policy decisions, exceptional data/privacy concerns, provider ambiguity, moderation/governance, and release control.

### Message 6 Research / Build Gate Summary
OBSERVED FACT:
- No new database columns were required.
- No second routine/recommendation/feedback/replenishment engine was introduced.
- Two minimal contract fixes were justified by actual evidence:
  1. Beauty Recommendation public wrapper SECURITY DEFINER + explicit auth guard because authenticated runtime was blocked by private EXECUTE revocation.
  2. Beauty Passport V2 exact-token enforcement for goal and the direct Data API write policies because the frontend/DB value contract was previously broader than the stated V2 option set.
- Both fixes were applied on Restore-Test only and verified with transaction-safe SQL probes.

NOT EVIDENCED:
- Browser Gate for current Message 6.
- Customer-facing Recommendation presentation/UX.
- Provider/Production behavior for this track.

CARRY-FORWARD:
- All unresolved items from Messages 2/11 through 5/11 remain active and are NOT deleted by completion of Message 6.
- Browser/provider/production evidence remains a separate evidence layer.
- The current TinyFish/browser-provider wallet block remains active until the provider becomes usable.

### Message 6 Master Conditions — Non-Negotiable
1. HANDOFF COMPLETENESS:
   Continue the full Master Handoff with every item, detail, open item, blocked item, not-evidenced item, dependency, permission, evidence level, and previous decision preserved. Nothing may disappear when moving to Message 7/11 or later.
2. RESEARCH BEFORE BUILD:
   Do not build for the sake of building. Research existing products, documentation, implementations, community/industry practice, and prior art at whatever breadth is justified, then reuse the strongest fitting canonical pattern for Velora. Build new only where a real observed gap remains and no suitable existing contract/path covers it. Never create duplicate engines.
3. ACTION FLOW IN PARALLEL:
   For every system, continue:
   Detect -> Decide -> Execute -> Verify -> Recover/Escalate
   Normal platform operation should run automatically end-to-end wherever the canonical architecture supports it. Human intervention is reserved for genuine exceptions: business-policy decisions, seller approval/suspension, legal publication, fraud/trust cases, exceptional refunds, provider ambiguity, payout/provider settlement, and release control.


## Message 7/11 — Beauty Question Design + Product State + AI

### 60. Beauty Question Design
CLASSIFICATION: DECISION CLOSED FOR CURRENT V2 / FUTURE EVOLUTION OPEN

RESEARCH OBSERVED:
- Clinique currently demonstrates that a short three-question skincare quiz can be used to key recommendations to skin type and concern rather than requiring a long intake. urlClinique skincare services and 3-question quizhttps://www.clinique.com/services
- Current skincare recommendation research also shows that richer recommendation systems may incorporate ingredient analysis and skin-condition/goal signals, but this does not prove that every available dimension should become a mandatory customer question. urlPubMed — deep learning skincare product recommendation and ingredient analysishttps://pubmed.ncbi.nlm.nih.gov/38411029/
- A 2026 dermatology intake study found most surveyed patients preferred focusing on one or two concerns rather than expanding the first interaction into a large set of concerns. This supports minimizing questionnaire burden, while recognizing that the study is clinical-intake research and not a Velora ecommerce experiment. urlPubMed — 4-question patient-centered dermatology intake studyhttps://pubmed.ncbi.nlm.nih.gov/42459240/
- Egyptian 2026 dermocosmetic consensus work supports context-specific ingredient selection and explicitly reports substantial uncertainty across ingredient/scenario combinations; this reinforces that Velora should not let an LLM invent ingredient suitability or medical-style conclusions. urlPubMed — Egyptian National Consensus on Dermocosmetic Ingredient Selectionhttps://pubmed.ncbi.nlm.nih.gov/41537948/

DECISION:
- Keep the current V2 customer entry at three questions:
  skin_type
  goal
  routine_budget
- Do not add concern, texture, effect, avoidance, shopping-priority, age, photo analysis, ingredient intolerance, or other fields merely because the database has optional columns.
- The existing optional profile fields remain available only as future controlled evolution points.
- A future question is justified only when evidence shows it has high signal, cannot be safely inferred, changes routine/product selection materially, and provides enough durable customer value to offset extra friction.

QUESTION EVOLUTION RULE:
Research -> signal value -> inferability -> decision impact -> persistence value -> privacy/UX review -> contract mapping -> implementation -> verification.
No speculative questionnaire expansion.

### 61. Product State × Beauty
CLASSIFICATION: CURRENT-STATE SAFETY CLOSED / BROWSER EVIDENCE OPEN

OBSERVED FACT:
- Canonical V2 recommendation requires approved Beauty products, EGP currency, positive availability, and budget fit.
- Canonical routine applies the same core approved/current-availability guard and can mark required steps unavailable instead of fabricating replacement products.
- Historical purchase/feedback is stored separately and is reused as historical learning context; current recommendation availability is not treated as historical memory.
- Transaction-safe negative-path tests on Restore-Test verified:
  inactive product -> excluded from Recommendation
  rejected product -> excluded from Recommendation
  product with base stock=0 and no active stocked variant -> excluded from Recommendation
  OOS product in Routine -> not selected; routine returned partial where that product was a required slot
- An initial OOS probe was corrected because the test temporarily restored stock before calling the Routine. The corrected probe confirmed the intended current-state behavior.
- Variant-aware interpretation remains important: base product stock=0 is not commercially OOS when an active stocked variant exists. The canonical engine correctly treats a stocked variant as current availability.

CORE RULE:
CURRENT AVAILABILITY != HISTORICAL MEMORY.
No future AI or recommendation layer may bypass canonical product state, approval, inventory, currency, or budget guards.

### 62. AI Status
CLASSIFICATION: CUSTOMER BEAUTY AI NOT DONE / GOVERNANCE AI-ASSISTED FOUNDATION EXISTS

OBSERVED FACT:
- Restore-Test currently has tables:
  ai_decision_runs
  ai_decision_signals
- Current counts are:
  ai_decision_runs=0
  ai_decision_signals=0
  proposed=0
  requires_human_approval=0
  executed=0
- Current repository has no OpenAI/LLM/GPT/Anthropic/Gemini implementation in the inspected application/runtime source.
- Current AI-named governance functions are rule-assisted decision tooling, not a customer beauty LLM:
  velora_generate_ai_signals
  velora_get_ai_decision_center
  velora_update_ai_decision
- velora_generate_ai_signals currently scans deterministic platform conditions such as open reconciliation findings, recent payment failures, and shipment exceptions and creates review signals.
- Therefore do NOT label current deterministic recommendation/routine code as AI and do NOT claim Beauty AI is implemented.

### 63. AI Architecture
CLASSIFICATION: ROADMAP / NOT IMPLEMENTED

RESEARCH / ARCHITECTURE DECISION:
- The preferred future boundary remains:
  Customer input -> AI interpretation -> structured candidate intent -> canonical validation -> deterministic recommendation/routine -> AI explanation -> Customer.
- This aligns with current OpenAI guidance that structured outputs constrain model data flow and that function calling is appropriate when a model bridges to tools/data/functions. urlOpenAI — Structured Outputshttps://developers.openai.com/api/docs/guides/structured-outputs urlOpenAI — agent safety and structured outputshttps://developers.openai.com/api/docs/guides/agent-builder-safety
- The LLM must never own the product catalog, inventory, monetary state, seller governance, refund decision, or order mutation boundary.
- No AI implementation is justified in Message 7 because the canonical deterministic V2 recommendation/routine path exists and the observed customer-AI runtime is absent.

### 64. AI Must Never
CLASSIFICATION: POLICY CLOSED / IMPLEMENTATION NOT YET REQUIRED

Non-negotiable future constraints:
- never invent products, ingredients, availability, pricing, or catalog facts
- never make unsupported medical claims
- never bypass approval, stock, budget, currency, or canonical eligibility
- never mutate orders, payments, commissions, payouts, gift-card balances, refunds, seller status, fraud decisions, or irreversible governance
- never replace canonical DB/business rules
- never create a second unexplained reason-code system

### 65. AI Failure Model
CLASSIFICATION: ROADMAP / NOT IMPLEMENTED

Required future safe handling:
- AI unavailable -> deterministic fallback
- invalid structured output -> discard
- canonical constraint violation -> canonical rejection
- timeout -> bounded safe retry
- ambiguous interpretation -> deterministic/safe path
- provider/model uncertainty -> do not mutate durable commerce state

No live AI fallback path exists today because no customer AI runtime exists.

### 66. AI Explainability
CLASSIFICATION: CONTRACT DIRECTION CLOSED / AI IMPLEMENTATION OPEN

OBSERVED CANONICAL REASON CODES:
- goal_match
- concern_match
- texture_match
- effect_match
- preference_match
- availability_match
- existing V2 routine also uses skin_type_match, step_match, budget_fit, feedback_positive, and seasonal_fit where applicable.

RULE:
- Reuse canonical reason codes and underlying rule evidence.
- AI explanation may translate/explain existing evidence but may not invent evidence or a parallel opaque score/reason taxonomy.
- Truthful product labels must distinguish:
  deterministic
  rule-based
  AI-assisted
  AI-driven
- Current V2 recommendation/routine are deterministic/rule-based, not AI-driven.

### 67. Beauty Browser Gate — Future
CLASSIFICATION: NOT EVIDENCED

Required Browser Gate remains:
guest -> auth
incomplete Passport -> questions
complete Passport -> edit
change one field -> preserve other saved answers
save -> routine
reasons visible
Arabic -> English
Account -> Beauty Journey
refresh persistence
mobile quiz
mobile results
mobile routine
product cards
Add All
purchase-linked feedback

Current blocker:
- Browser verification for the current branch is not evidenced; the previously used browser automation provider had an insufficient wallet balance. Do not convert source/DB/CI results into Browser PASS.

### Message 7 Action Flow — Parallel
Beauty customer flow:
Detect Passport entry/change
-> authenticate
-> validate canonical V2 contract
-> persist profile
-> emit profile-updated event
-> refresh deterministic routine when fingerprint changes
-> derive current recommendations through canonical V2 eligibility
-> use historical feedback/purchase signals only as contextual inputs
-> enforce product state and availability
-> present explainable rule evidence
-> add selected routine items through the existing Routine -> Cart adapter
-> checkout remains canonical
-> failure/recovery remains bounded and auditable.

AI future flow:
Detect intent
-> AI interpretation (future)
-> strict structured candidate intent
-> canonical validation
-> deterministic product/routine selection
-> optional AI explanation grounded only in returned evidence
-> safe fallback on any AI failure
-> human escalation only for genuine governance/policy/provider exceptions.

### Message 7 Execution / Research Gate
OBSERVED FACT:
- No speculative Passport question expansion was made.
- Product state safeguards were verified with transaction-safe negative paths.
- AI audit found a small existing rule-assisted governance foundation, but no customer beauty LLM runtime.
- No duplicate recommendation/routine/feedback/replenishment engine was introduced.
- No OpenAI/LLM dependency was added.
- Two Message 6 fixes remain the current source/DB baseline:
  1. canonical Recommendation V2 public wrapper ACL/runtime fix
  2. canonical Beauty Passport V2 exact token contract hardening

NOT EVIDENCED:
- Browser behavior for Passport/Routine/Recommendation/Feedback.
- Customer-facing Recommendation UX.
- Actual customer AI runtime.
- Provider/Production behavior.

CARRY-FORWARD:
- All OPEN/BLOCKED/PENDING/NOT EVIDENCED items from Messages 2 through 6 remain active and are not removed by Message 7 completion.
- Production remains frozen.
- Browser/provider evidence remains a separate gate.

### Message 7 Master Conditions — Non-Negotiable
1. HANDOFF COMPLETENESS:
   Continue the same Master Handoff with every prior item, dependency, policy gap, ACL/RLS detail, evidence layer, blocked item, and carry-forward item preserved.
2. RESEARCH BEFORE BUILD:
   Do not build merely because a feature can be built. Search proven prior art/documentation/implementations and reuse canonical contracts first. Build only where an observed gap remains and no suitable existing path covers it.
3. ACTION FLOW IN PARALLEL:
   Continue Detect -> Decide -> Execute -> Verify -> Recover/Escalate across the whole platform. Normal paths must operate automatically wherever the current architecture supports it; human input is reserved for real business-policy, governance, provider, fraud/trust, exceptional refund, payout, and release-control boundaries.

## Message 8/11 — Payments + Webhook / Current Active Execution Lane

### 68. Current Lane Authority
CLASSIFICATION: ACTIVE EXECUTION LANE

OBSERVED FACT:
- Payments + Webhook remains the current active execution lane.
- Beauty Passport and Owner/Governance were added to this same Master Plan and did not replace or pause the payment/webhook lane.
- Current work remains Restore-Test only. Production is frozen.

NON-NEGOTIABLE MASTER CONDITIONS:
1. HANDOFF COMPLETENESS — continue the full Master Handoff with every prior item, dependency, policy gap, ACL/RLS detail, evidence layer, blocked item, pending item, and NOT EVIDENCED item preserved. Nothing disappears when execution moves between messages.
2. RESEARCH BEFORE BUILD — Existing Contract -> Research -> Observed Gap -> Actual Need -> Smallest Safe Change. Research prior art/documentation/implementations first; reuse canonical Velora paths; build only where a real observed gap remains. No duplicate payment/webhook engine.
3. ACTION FLOW IN PARALLEL — Detect -> Decide -> Execute -> Verify -> Recover/Escalate. Normal platform operation should complete automatically wherever the canonical architecture supports it. Human intervention is limited to true exceptions such as provider ambiguity, fraud/trust, exceptional refunds, governance, payout/provider settlement, legal publication, and release control.

### 69. Payment Route
OBSERVED FACT:
- Restore-Test payment route is Paymob test/Card for EG/EGP and COD for EG/EGP.
- Other providers are inactive for the current execution scope.

### 70. Canonical Payment RPCs
OBSERVED FACT:
- velora_create_payment_attempt is authenticated-only for customer use; anon EXECUTE is false.
- velora_get_payment_route is authenticated-only; anon EXECUTE is false.
- velora_set_order_payment_method is authenticated-only and enforces authenticated ownership/payment-state constraints.
- Current payment-attempt contract enforces authentication, allowed purpose, idempotency-key bounds, country validation, order ownership, payable-order state, positive amount, and route resolution.
- Current set-payment-method contract requires the owned order, pending payment status, active payment method, and an operational route; current Restore-Test operational allowance is COD or Paymob card/test.

ACL OBSERVATION:
- Current Restore-Test also has velora_attach_payment_provider_session 3-arg and 4-arg overloads; both are SECURITY DEFINER with anon=false, authenticated=true, service_role=true.

### 71. Payment / Order RLS
OBSERVED FACT:
- orders RLS is enabled. Customer SELECT is limited to customer_id = auth.uid(); staff SELECT is allowed through the staff guard.
- payment_attempts RLS is enabled. Customer SELECT is limited to own user_id, with staff access.
- payments RLS is enabled. Customer SELECT is limited to payments belonging to their own orders, with staff access.
- No RLS weakening was introduced for payment testing.

### 72. Provider Session Binding
OBSERVED FACT:
- Canonical 4-argument binding function is velora_attach_payment_provider_session(uuid,text,text,text).
- It requires auth.uid(), locks the owned payment attempt/order relationship, validates provider/session fields, requires provider_order_id for Paymob, stores provider_session_id/provider_payment_id and metadata.paymob_order_id, and writes payment_provider_session_attached audit evidence.
- The current Paymob checkout runtime uses the 4-argument form, not the weaker 3-argument overload.
- A server-authoritative recovery function exists separately: velora_recover_paymob_provider_session(uuid,text,text), with authenticated EXECUTE explicitly revoked and service_role EXECUTE only.

### 73. Provider-Start Failure Gap — CURRENT STATE AFTER HARDENING
CLASSIFICATION: SOURCE/DB CONTRACT GAP CLOSED; LIVE PROVIDER EVIDENCE OPEN

OBSERVED FACT:
- Current Git source contains supabase/functions/velora-paymob-checkout/index.ts.
- Current Restore-Test deployment velora-paymob-checkout is ACTIVE version 16 with verify_jwt=true.
- Direct comparison of deployed runtime content and the Git branch source showed exact content parity for index.ts (12,519 bytes in both), so the earlier source/runtime parity concern is now superseded at the current runtime level.
- Current checkout sequence remains: authenticated payment-attempt creation -> Paymob POST /v1/intention/ -> provider-session binding -> Unified Checkout URL.
- Current implementation explicitly compensates provider-start failures by calling velora_mark_marketplace_payment_initialization_failed(...).
- If Paymob intention creation returns non-2xx, the function records a local marketplace payment-attempt failure and returns a controlled failure response instead of intentionally leaving the attempt pending.
- If the intention response lacks required identifiers, the same canonical initialization-failure path is used.
- If client_secret is missing after a valid intention, the runtime invokes the server-authoritative Paymob session recovery path; if recovery fails, it returns manual_reconciliation_required rather than inventing a second payment engine.
- If provider-session binding fails, the runtime retries the canonical bind once and then invokes the same server-authoritative recovery function; unrecovered ambiguity returns manual_reconciliation_required.

CURRENT SUPPORTING MIGRATIONS:
- 20260928093030_marketplace_payment_initialization_failure_contract_20260928
- 20260928093550_recover_paymob_provider_session_20260928
- Existing downstream failure recovery remains canonical through trg_velora_release_inventory_after_failed_payment -> private.velora_release_inventory_after_failed_marketplace_payment().

### 74. Payment Action-Failure Cases A-E

#### Case A — Attempt created -> provider intention fails
CLASSIFICATION: CLOSED-DONE AT L1-L4 / PROVIDER RUNTIME EVIDENCE OPEN

OBSERVED FACT:
- velora_mark_marketplace_payment_initialization_failed is authenticated-only; anon=false; authenticated=true; service_role=true.
- The function only operates on an owned marketplace-order payment attempt and is idempotent for terminal states.
- Controlled Restore-Test transactional probe on Order #68 / payment attempt dd223161-93e3-4770-9de4-d58c8abc0cce produced:
  attempt pending -> failed
  order pending -> cancelled
  order payment_status pending -> failed
  pending payment read-model -> failed
  payment_failed_inventory_released audit count -> 1
- The same probe was rolled back. Follow-up read verified the attempt/order/payment state returned to pending/pending.
- Trigger definition observed: AFTER UPDATE OF status on payment_attempts WHEN new.status='failed', executing private.velora_release_inventory_after_failed_marketplace_payment().
- Therefore provider-start failure compensation and the downstream inventory/order/payment failure path are one canonical chain; no second failure engine is required.

#### Case B — Provider intention exists -> local provider-session binding fails
CLASSIFICATION: BACKEND RECOVERY CONTRACT CLOSED / AMBIGUOUS LIVE PROVIDER EVENT OPEN

OBSERVED FACT:
- velora_recover_paymob_provider_session is service_role-only and validates Paymob purpose, terminal state, existing provider_order_id conflicts, and existing provider_session_id conflicts.
- A controlled Restore-Test recovery attempt with a mismatched provider order ID correctly raised PAYMOB_RECOVERY_PROVIDER_ORDER_CONFLICT. This proves conflict protection is active.
- A controlled same-binding recovery on a pending Paymob attempt preserved the existing session/order binding and returned the expected pending state. The transaction was rolled back.
- Runtime code uses the recovery path after canonical binding fails and returns a retry or manual reconciliation outcome rather than silently proceeding with an unbound external intention.

#### Case C — Session ready -> payment/customer failure
CLASSIFICATION: BACKEND PATH CLOSED / BROWSER + LIVE PROVIDER EVIDENCE NOT EVIDENCED

OBSERVED FACT:
- Current Paymob webhook v27 maps provider transaction state into the canonical payment_attempt status using a monotonic transition function.
- Marketplace captured -> order payment_status paid, and a pending order becomes confirmed on the captured transition.
- Failed/refunded states are propagated to payment/order read models through the existing webhook reconciliation path.
- The downstream failed-payment path remains the same canonical inventory/order/payment path rather than introducing another engine.

NOT EVIDENCED:
- real customer/browser sandbox completion on the current runtime
- live provider settlement
- Production behavior

#### Case D — Webhook failure
CLASSIFICATION: OPEN / NOT EVIDENCED OPERATIONAL RECOVERY POLICY

OBSERVED FACT:
- Current webhook records a provider event, processes the canonical payment/subscription/seller-ad branch, and marks the webhook event processed only after successful handling.
- Current provider_webhook_events records retain payload hash, signature verification, status, failure_reason, received_at, processed_at, and retry_count fields.
- The current implementation does not justify creation of a second internal webhook retry engine.

OPEN:
- end-to-end evidence for downstream processing failure followed by a successful replay/retry
- explicit provider retry/replay behavior under a genuine failed callback
- operational reconciliation path for an externally completed payment whose callback remains unprocessed

RULE:
Do not invent a second scheduler/queue here. Reuse provider retry behavior and existing provider_webhook_events state; add a Velora replay helper only if an observed operational gap proves it is needed.

#### Case E — Duplicate webhook
CLASSIFICATION: CLOSED-DONE AT WEBHOOK CONTRACT

OBSERVED FACT:
- Current webhook derives eventId from transaction ID (or a deterministic fallback), computes a payload SHA-256 hash, and checks provider_webhook_events before processing.
- An already-processed event with the same payload hash is returned as duplicate=true with state_change='none'.
- A same-event payload mismatch is rejected with WEBHOOK_EVENT_PAYLOAD_MISMATCH.
- Payment status transitions are monotonic: captured stays captured unless refund arrives; failed/cancelled remain terminal; authorized/requires_action can move only through allowed forward/terminal states.
- Restore-Test currently contains processed Paymob webhook events with signature_verified=true and status=processed.

### 75. Paymob Webhook Security / Runtime
OBSERVED FACT:
- velora-paymob-webhook-restore-test is ACTIVE version 27 and verify_jwt=false.
- verify_jwt=false is intentional because this external provider callback is authenticated inside the function using Paymob HMAC verification.
- Current webhook uses HMAC-SHA512 with constant-time comparison and correlates the Paymob order ID to Velora's payment_attempts metadata/paymob_order_id relationship.
- Current source also preserves subscription and seller-ad payment branches instead of creating a separate marketplace-only webhook engine.
- Direct comparison of deployed runtime and Git source showed exact content parity for the current webhook index.ts (15,078 bytes in both).

RESEARCH-FIRST SUPPORTING EVIDENCE:
- Paymob's current Create Intention documentation specifies POST /v1/intention/, secret-key Token authorization, amount in cents, matching currency/integration requirements, and response identifiers including intention_order_id, id, and client_secret. It also describes notification_url and redirection_url behavior. 
  Source: https://developers.paymob.com/paymob-docs/intention-apis/create-intention
- Paymob's current Transaction Callback documentation describes server-side POST callbacks and says order.id is used to correlate the received transaction with the order bound during intention creation. 
  Source: https://developers.paymob.com/paymob-docs/manage-callback/transaction-callbacks
- Paymob's current HMAC documentation describes HMAC-based callback verification, consistent with treating the webhook as publicly reachable at the HTTP layer while enforcing provider authenticity inside the handler. 
  Source: https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac/hmac-for-card-tokens
- Paymob provides a webhook testing tool for inspecting success/failure/refund/void/capture callbacks before production. 
  Source: https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/webhook-testing-tool
- Adyen's current idempotency documentation describes safe retries with idempotency keys and asynchronous server-to-server webhooks as a resilience pattern for missing responses/timeouts. 
  Source: https://docs.adyen.com/development-resources/api-idempotency
- Stripe's current webhook/idempotency documentation remains useful prior art for asynchronous event handling and safe retry semantics; Velora should reuse those principles without introducing provider-specific copies of the same canonical state machine. 
  Sources: https://docs.stripe.com/webhooks and https://docs.stripe.com/api/idempotent_requests

### 76. Restore-Test Webhook Evidence
CLASSIFICATION: OBSERVED RESTORE-TEST EVIDENCE / NOT LIVE SETTLEMENT PROOF

OBSERVED FACT:
- Current Restore-Test contains two processed Paymob webhook records with signature_verified=true, status=processed, retry_count=0.
- Historical processed events included one event moving a payment attempt to captured and the corresponding order payment_status to paid.
- This proves Restore-Test webhook processing occurred; it does not prove live Paymob settlement or Production delivery.

### 77. Paymob Sandbox Evidence Workflow
CLASSIFICATION: CI EVIDENCE PATH EXISTS / CURRENT FULL PASS NOT EVIDENCED

OBSERVED FACT:
- .github/workflows/velora-paymob-sandbox-evidence.yml implements the intended path:
  Auth -> fixture/pending order -> velora-paymob-checkout -> Paymob intention -> sandbox payment/browser drill -> DB payment attempt/webhook polling -> final order/payment state -> evidence artifact.
- Workflow expects captured payment_attempt, processed verified webhook, order payment_status paid, and order status confirmed before declaring the run passed.
- The latest previously confirmed Run #4 (36296512312, 2026-09-27 05:12 UTC, SHA fe339f2c...) is historical evidence against the older runtime state. It failed because checkout returned HTTP 400 without a checkout URL; no Paymob intention or sandbox payment path was confirmed. The current v16 deployment happened later and must be judged independently.

### 78. Current Source / Runtime Parity Reconciliation
CLASSIFICATION: CLOSED-DONE FOR CURRENT CHECKOUT + WEBHOOK SOURCE PARITY / HISTORICAL NOTE RETAINED

OBSERVED FACT:
- The earlier provenance note said GitHub code search could not locate a matching checkout source. Direct current Git fetch resolved this as a code-search/index visibility problem rather than evidence that the source was absent.
- Current Git contains both:
  supabase/functions/velora-paymob-checkout/index.ts
  supabase/functions/velora-paymob-checkout/deno.json
  supabase/functions/velora-paymob-webhook-restore-test/index.ts
  supabase/functions/velora-paymob-webhook-restore-test/deno.json
- Current deployed versions are checkout v16 and webhook v27, and their deployed index.ts contents exactly match the Git branch files.
- Therefore the earlier runtime/source parity gap is SUPERSEDED for the current runtime. The historical provenance document docs/audit/PAYMOB_RUNTIME_PROVENANCE_2026-09-28.md must remain as historical evidence and must not be treated as the current version record.

### 79. Current Payment Evidence Snapshot
OBSERVED FACT:
- Restore-Test currently reports 13 orders, 36 payment_attempts, 11 payments, and 2 processed Paymob webhook events.
- Several pending marketplace payment attempts for Order #62 currently have provider_session_id/provider_payment_id values already attached; this is test-state evidence, not settlement proof.
- Multiple pending attempts remain from earlier evidence drills. This reinforces the previously carried OPEN policy/automation question for abandoned pending orders. Do not solve that policy by inventing a TTL during Message 8.

### 80. Launch Gates — Payment/Provider
STATUS:
- payment_provider -> BLOCKED / REQUIRED
- webhook_verification -> BLOCKED / REQUIRED
- production_infra -> PENDING / REQUIRED
- rollback_backup -> PENDING / REQUIRED
- shipping_provider -> BLOCKED / NOT REQUIRED (manual fulfillment accepted)

REASON:
- Backend/source/DB contracts are substantially hardened, but the current record still lacks the required current Browser + provider-level settlement evidence and Production-readiness evidence.
- No claim of live Paymob settlement PASS is permitted.

### 81. Message 8 Action Flow — Parallel
Detect provider-start attempt
-> authenticate customer
-> validate canonical order/payment route/idempotency
-> create canonical payment_attempt
-> call Paymob Intention API
-> if provider-start fails: mark marketplace initialization failed
-> trigger canonical downstream inventory/order/payment/commission recovery
-> if intention succeeds: bind provider session
-> if bind fails: recover provider session server-authoritatively or escalate manual reconciliation
-> present provider checkout
-> receive HMAC-verified webhook
-> dedupe by provider event + payload hash
-> apply monotonic payment transition
-> synchronize canonical order/payment read models
-> audit
-> retry/reconcile only through existing provider/event-state mechanisms
-> human exception only for genuine provider ambiguity, fraud/trust, exceptional refund, payout/settlement, or release control.

NO DUPLICATE ENGINE RULE:
- Payment failure recovery remains the existing payment_attempt trigger/helper.
- Provider-session recovery remains the existing service-role recovery function.
- Webhook handling remains the existing Paymob webhook function plus provider_webhook_events.
- Do not add a parallel payment failure engine, webhook scheduler, or separate reconciliation model without a new observed gap.

### 82. Message 8 Execution Classification
CLOSED-DONE:
- Current Paymob checkout source/runtime parity.
- Authenticated-only canonical payment RPC ACL baseline.
- Payment/order/payments RLS baseline.
- Provider session binding owner gate and Paymob order binding guard.
- Case A provider-start failure compensation at source/DB, including downstream inventory/order/payment recovery, with rollback proof.
- Case B provider-session recovery contract, conflict protection, and service-role-only ACL.
- Case E duplicate/monotonic webhook contract.

OPEN / NOT EVIDENCED:
- Case C current Browser/real sandbox payment completion.
- Case D full operational webhook-failure replay/reconciliation evidence.
- Current customer Browser Gate for payment UI.
- Current provider settlement evidence.
- Production infrastructure/backup/rollback evidence.
- Abandoned pending-order/reservation business policy remains carried forward.

BLOCKED:
- payment_provider launch gate until provider-level evidence is obtained.
- webhook_verification launch gate until current verified provider evidence is obtained.
- Browser/provider automation remains unavailable when its external provider/tooling is not usable; do not convert this into a source/DB PASS.

INFERRED:
- The current payment-start architecture now has a coherent single canonical compensation chain for the observed provider-start failure cases, while remaining intentionally conservative about external-provider ambiguity.

HYPOTHESIS / DISALLOWED CLAIM:
- Do not infer the exact historical HTTP 400 root cause from Run #4. The historical root cause remains unresolved because available logs did not prove it.
- Do not blame credentials, RLS, provider outage, account configuration, or browser cache without new evidence.

### Message 8 Evidence Discipline
- L1 Source: current Git checkout/webhook sources and workflow inspected.
- L2 DB: current RPC/function definitions, RLS, payment tables, and webhook event records inspected.
- L3 ACL/RLS: payment functions and tables verified.
- L4 Negative Path: Case A transactional failure compensation and Case B session recovery/conflict tested with rollback.
- L5 CI: historical sandbox workflow failure retained; current v16 must be independently re-run to establish new CI evidence.
- L6 Preview: no current Message 8 payment UI Preview PASS claimed merely from source changes.
- L7 Browser: NOT EVIDENCED.
- L8 Provider: NOT EVIDENCED for current full settlement chain.
- L9 Production: NOT EVIDENCED; Production remains frozen.

### Message 8 Carry-Forward
- All unresolved items from Messages 2/11 through 7/11 remain active and are NOT deleted by Message 8.
- Seller Dashboard re-entry remains Browser-gated.
- Seller post-approval re-review policy, abandoned pending-order/reservation policy, and legacy order-item status contract remain open.
- Subscription commercial policy/runtime/browser gaps remain open.
- Ads reporting/attribution/pricing/provider evidence remain open.
- Commission policy/refund treatment remains open.
- Payout provider execution/reconciliation evidence remains open.
- Promotions free_shipping/stacking/targeting/economics/reversal policy gaps remain open.
- Gift-card refund/cancel accounting/expiry policy and Browser evidence remain open.
- Returns customer UX/refund allocation/provider refund/window policy remain open.
- Notifications Browser push/delivery evidence remains open.
- Beauty Passport/Routine/Recommendation browser evidence and customer Recommendation UX remain open.
- Customer Beauty AI remains NOT DONE / ROADMAP; no AI engine is to be introduced here.
- Production infrastructure and rollback/backup remain PENDING and outside Restore-Test changes.


## Message 9/11 — Legal + Owner Dashboard / Governance Control Plane

### Message 9 master conditions
1. HANDOFF COMPLETENESS — Message 9 is appended to the same Master Execution Plan. Nothing from Messages 2/11 through 8/11 is deleted, overwritten, or considered closed merely because execution moved to Legal/Owner. All prior OPEN / BLOCKED / PENDING / NOT EVIDENCED items remain carry-forward.
2. RESEARCH BEFORE BUILD — do not invent a second Owner dashboard engine, permission engine, legal engine, audit engine, release engine, or governance scheduler. Reuse existing canonical contracts and UI surfaces whenever the observed gap can be closed by connecting them. Research prior art first; implement only a concrete observed need.
3. ACTION FLOW IN PARALLEL — Detect -> Decide -> Execute -> Verify -> Recover/Escalate remains active across Legal, Owner, Seller, Commerce, Payments, Trust, Release, and all other platform domains. Normal flows should self-complete through canonical contracts; human intervention remains for genuine governance/legal/provider/fraud/trust/refund/payout/release exceptions.

### 82. Legal — Current Contract and Environment State
CLASSIFICATION: BACKEND GOVERNANCE FOUNDATION CLOSED / PUBLISHABLE LEGAL CONTENT NOT PRESENT / RUNTIME EVIDENCE OPEN

OBSERVED FACT:
- Existing architecture includes legal_documents, versioning fields, content hashes, publication/effective-date state, legal_acceptances, server-side legal helpers, and RLS.
- The historical handoff snapshot reported legal_documents = 0. That is a historical baseline and must be preserved as historical evidence only.
- CURRENT Restore-Test database audit now shows legal_documents = 4 and legal_acceptances = 4.
- CURRENT legal_documents status distribution is 4 retired, 0 published.
- All four current rows are Restore-Test QA fixtures from 2026-09-27. They are not valid current production legal content.
- CURRENT legal_acceptances are checkout acceptances tied to those retired QA versions. Acceptance records exist as evidence of the test flow; they do not create a currently published legal document.
- Current RLS allows public/anonymous and authenticated reads only for documents that are published and effective, while staff can read all legal documents. legal_acceptances read is limited to the authenticated user's own records or staff.
- Checkout remains fail-closed because there is no currently published applicable legal document. The established failure contract remains LEGAL_DOCUMENTS_NOT_PUBLISHED.
- docs/legal/VELORA_EGYPT_LEGAL_DRAFT_PACK_2026-09-26.md remains DRAFT — DO NOT PUBLISH.
- No legal publication is to be simulated, seeded as a fake proof, or inferred from retired QA rows.

CURRENT LEGAL RPC CONTRACTS:
- velora_upsert_legal_document(...) is authenticated + staff governed. It validates type/locale/version/title/body/status, computes the SHA-256 body hash server-side, validates any supplied client hash against the server hash, and requires Owner authority for approved/published/retired statuses.
- velora_publish_legal_document(p_document_id,p_effective_from) is authenticated + explicit Owner role required. It requires the selected version to be approved, retires a prior published version for the same document_type + locale, publishes the selected version, and writes a legal_document_published audit event.
- Legal Owner authority is therefore enforced server-side; UI visibility is not the authorization boundary.
- No unpublish/rollback/legal-retire UI contract was newly invented. Existing retirement behavior must be treated as the canonical state transition until a separate observed policy/contract justifies another action.

LEGAL UI OBSERVATION:
- Existing renderAdminLegal()/loadAdminLegalFromDb() already use the canonical legal RPCs and already hide the Publish action unless the loaded UI role set contains owner and the row is approved.
- Before Message 9, this existing Legal UI was not reachable from the current canonical Admin navigation.
- Therefore the concrete observed gap was control-surface reachability, not absence of a legal backend.

### 83. Owner Dashboard — First-Class Canonical Track
CLASSIFICATION: OPEN / PARTIALLY CONNECTED

OWNER PURPOSE:
- Owner = governance + exception control.
- Owner is NOT intended to be a human operator for every normal automated flow.
- Normal customer/seller/operations paths should remain server-authoritative and automated.
- Owner should enter where policy, high-impact exception, legal approval, fraud/trust review, settlement/reconciliation, launch control, or other explicitly governed action requires privileged intervention.

CURRENT OWNER UI OBSERVATION:
- The current canonical control surface is a shared Admin/Owner operations shell in src/scripts/12-localization.js.
- Existing canonical sections include Dashboard, Sellers, Products, Orders, Users, Audit Logs, Seller Applications, Seller Onboarding, Promotions, Coupons, Gift Cards, and Trust & Compliance.
- Gift Cards already has an explicit Owner-only UI guard; the server-side issuance RPC independently enforces Owner-only access.
- Existing Release Control is added to the same Admin control surface by src/scripts/11-admin.js and uses the existing release control-plane RPCs.
- A legacy owner analytics/audit implementation remains inside 00-localization.js, but there is no active legacy owner shell/DOM or canonical Owner state machine there. It must not be revived as a second Owner platform.
- The current Owner dashboard is therefore NOT evidenced as fully closed for the complete governance scope.

OWNER DASHBOARD STATUS:
- OWNER DASHBOARD = OPEN.
- Owner entry route + canonical Owner authorization preflight are now source-connected.
- Legal is now reachable from the canonical admin/owner navigation through the existing Legal UI and canonical legal RPCs.
- Full Owner governance completeness, action coverage, per-surface authority, end-to-end auditability, exception tooling, failure recovery, notification behavior, and Owner browser verification remain OPEN / NOT EVIDENCED where applicable.

### 84. Owner Scope Audit Matrix
RULE:
- This is a working audit matrix, not proof that every row is currently granted.
- Only actual DB/code evidence may promote a capability from NOT EVIDENCED.
- Do not invent permission names or create a granular permission engine merely to fill this table.

| Area / Action | Customer | Seller | Staff/Admin | Owner | Service Role |
|---|---|---|---|---|---|
| Own profile | contract-defined | contract-defined | limited / governance where supported | governance | backend only |
| Seller product create | No | own seller scope via canonical seller RPCs | moderation/ops only where contract permits | governance | backend |
| Product approval | No | No self-approval | staff via canonical product-status RPC | owner inherits current staff guard | backend |
| Product deactivate/reactivate | No | own approved product availability contract | moderation where supported | governance | backend |
| Own order read | yes | seller-scoped order visibility where contract exists | ops/staff where supported | governance | backend |
| Own payment read | yes | seller-relevant scope only where supported | ops where supported | governance | backend |
| Gift-card issuance | No | No | No direct grant evidenced | OWNER-ONLY | backend execution |
| Legal drafting/version write | No | No | staff write for draft/in_review path | governance / approval authority | backend |
| Legal publish | No | No | NOT GRANTED by current publish RPC | OWNER-ONLY | backend |
| Seller suspension | No | No self-governance | staff via canonical seller-status RPC | owner currently satisfies staff guard | backend |
| Promotion governance | No | seller-owned promotion writer NOT EVIDENCED | staff via canonical promotion contracts | owner currently satisfies staff guard | backend |
| Payout request | own eligibility/request where supported | own seller scope | ops where supported | governance | backend |
| Payout execution | No | No direct execution grant | staff via canonical execution RPC | owner currently satisfies staff guard | backend |
| Release / launch control | No | No | staff control-plane access currently evidenced | governance through current staff contract | backend |
| Trust / returns / disputes | customer-owned request paths where supported | own scoped paths where supported | staff governance where canonical contracts exist | owner currently satisfies current staff guards | backend |
| User account governance | No | No | staff via canonical account-action contract where supported | owner currently satisfies current staff guard | backend |
| Service-role operations | No | No | No | No frontend privilege | service/backend only |

IMPORTANT AUTHORIZATION OBSERVATIONS:
- Current role enum is exactly: customer, seller, admin, owner.
- private.velora_has_role(required_role) is SECURITY DEFINER and checks user_roles for auth.uid().
- private.velora_is_staff() is SECURITY DEFINER and currently evaluates to admin OR owner.
- Therefore Owner currently inherits any function protected only by velora_is_staff(). This is an OBSERVED FACT about the current control model, not a statement that it is the final desired governance policy.
- There is currently no independently evidenced fine-grained permission catalog. Do not invent one.
- Service-role execution remains a backend/service identity, not a frontend convenience privilege.

### 85. Canonical Owner Entry / Route Gap and Smallest Safe Fix
CLASSIFICATION: OBSERVED GAP CLOSED AT SOURCE LEVEL / BROWSER PROOF OPEN

OBSERVED PRE-FIX GAP:
- src/scripts/63-platform-router.js declared owner as a platform route and captured originalOpenOwner from window.openOwnerPlatform.
- Prior to this fix, src/scripts/00-localization.js did not contain a real active Owner platform implementation. Its fallback window.openOwnerPlatform routed to window.switchPlatform('owner'), while the legacy switchPlatform('owner') only displayed “Owner Center (coming next)” and did not open a real Owner surface.
- This created a concrete route-to-no-op path: the router could recognize #owner while the captured opener did not provide a real Owner control surface.
- The canonical Admin/Owner implementation already existed in 12-localization.js and correctly authenticated Admin/Owner roles.

SMALLEST SAFE CHANGE IMPLEMENTED:
- openCanonicalAdmin(requiredRole=null) now accepts an optional role requirement.
- openCanonicalOwner() calls the existing canonical Admin shell with requiredRole='owner'.
- Existing platform switch behavior now distinguishes admin and owner instead of treating both identically.
- window.openOwnerPlatform is assigned to the canonical Owner opener before the platform router loads, so 63-platform-router.js captures a real Owner function rather than the legacy no-op fallback.
- window.closeOwnerPlatform is mapped to the existing canonical Admin close surface.
- Canonical navigation now labels the Dashboard as Owner Dashboard when the authenticated role set contains owner.
- Existing Legal UI is exposed as a canonical Legal section and routes to renderAdminLegal(), reusing existing Legal RPCs and controls.
- No new database table, enum, permission string, scheduler, analytics engine, audit engine, legal engine, or Owner engine was introduced.

IMPLEMENTATION COMMIT:
- c4fe4dfdb817a7ca46dbfe2a664a8fea2f9350a8
- file changed: src/scripts/12-localization.js
- no Production change

### 86. Legal + Owner Authorization Evidence
CLASSIFICATION: L1-L4 BACKEND CONTRACT EVIDENCE / UI EVIDENCE OPEN

OBSERVED FACT:
- velora_issue_gift_card is explicitly OWNER-ONLY and has anon EXECUTE false.
- velora_publish_legal_document has anon EXECUTE false, authenticated EXECUTE true, service_role EXECUTE true, and an explicit Owner check inside the function.
- velora_upsert_legal_document has authenticated execution plus staff guard, with explicit Owner requirement for approved/published/retired status.
- velora_set_seller_status, velora_set_product_status, velora_admin_update_order_status, velora_create_platform_promotion, velora_set_platform_promotion_active, velora_resolve_return, velora_record_payout_execution, velora_resolve_dispute, velora_resolve_privacy_request, velora_account_action, and velora_moderate_beauty_feedback are currently protected primarily by the existing staff guard. Their exact business rules remain authoritative.
- Legal and governance writes are audited where the inspected function definitions explicitly insert audit_logs.
- audit_logs itself is readable by staff only through the current RLS policy.
- No RLS relaxation was made as part of Message 9.

NOT EVIDENCED:
- a complete Owner-only action catalog
- a complete matrix separating Admin vs Owner for every high-impact operation
- a complete browser proof that every privileged button is present only where intended
- a complete negative-path matrix proving each unauthorized role is denied at runtime for every Owner-sensitive action.

### 87. Owner Privileged-Action Standard
For every privileged action, the audit checklist remains:

Owner identity
-> authorization
-> input validation
-> state transition
-> side effects
-> audit event
-> failure handling
-> idempotency where applicable
-> notification if an existing canonical notification contract supports it
-> final Browser proof whenever the action is UI-facing

This checklist must be applied to:
- Seller approval/suspension/moderation exceptions.
- Product approval/rejection/deactivate/reactivate.
- Order exception/cancellation/refund governance.
- Payment attempt/capture/failure/provider-reference exception handling.
- Refund/return resolution.
- Subscription lifecycle and billing exceptions.
- Advertising governance and billing exceptions.
- Commission correction/reconciliation.
- Payout execution/settlement/reconciliation.
- Promotion creation/activation and later policy controls.
- Gift-card issuance and exception handling.
- Legal version creation, approval, publication, and acceptance evidence.
- User account governance.
- Fraud/trust decisions.
- Platform setting changes.
- Audit access.
- Release/launch control.
- Backup/rollback readiness controls.

### 88. Release / Launch / Backup Governance Carry-Forward
OBSERVED FACT:
- Existing release control is already a separate control-plane surface and does not itself deploy code.
- velora_run_launch_gate_audit() is staff-only and explicitly preserves payment_provider=blocked, webhook_verification=blocked, production_infra=pending, rollback_backup=pending, and shipping_provider=blocked/not-required according to the current evidence model.
- The new Owner route does not override these launch-gate states.
- Owner visibility of release/launch/backup state is therefore partially present through existing control-plane paths, but full Owner-specific browser evidence and end-to-end governance proof remain OPEN.
- No backup/rollback claim is made from database structure alone.

### 89. Legal / Owner Action Flow — Parallel
LEGAL:
Detect missing/changed legal requirement
-> determine required document/version/jurisdiction/locale from canonical contract
-> draft/review through existing legal workflow
-> validate content + server-side SHA-256 hash
-> require Owner approval for approved/published state
-> publish exactly one applicable current version per document type + locale through canonical publisher
-> record audit evidence
-> expose only published/effective documents publicly
-> force applicable commercial actions to fail closed when required legal documents are absent
-> monitor acceptance/reacceptance requirements
-> recover through legal version rollback/retirement only where the existing contract supports it
-> escalate to Owner/Legal human decision for actual legal approval/content policy.

OWNER / GOVERNANCE:
Detect operational signal or exception
-> determine whether canonical automation already handles the normal path
-> if normal path exists, execute through the existing automation and do not involve Owner
-> if privileged governance is required, authenticate user and resolve actual role(s)
-> authorize using the existing canonical function guard
-> validate action inputs/state transition
-> execute canonical writer
-> apply existing side effects/triggers
-> write/read audit evidence
-> retry only through existing idempotent mechanism where supported
-> notify through existing notification contract when supported
-> recover through existing canonical compensation/workflow
-> escalate only when provider ambiguity, fraud/trust, exceptional refund, payout settlement, legal approval, release control, or other true governance exception remains.

NO DUPLICATE ENGINE RULE:
- Legal uses legal_documents/legal_acceptances + existing legal RPCs.
- Owner operations use the canonical Admin/Owner control surface + existing domain RPCs.
- Audit uses existing audit_logs and existing canonical audit/read paths.
- Release uses existing release control plane.
- Trust/returns/disputes use existing trust contracts.
- Payments/webhooks use their existing canonical chain.
- Do not create a second Owner engine, generic action dispatcher, generic permissions engine, or generic governance database without a new observed contract gap.

### 90. Research-First Owner / Legal Prior Art
RESEARCHED PATTERNS:
- OWASP authorization guidance emphasizes least privilege, deny-by-default, explicit authorization checks, and logging authorization events.
- Supabase documentation/security guidance distinguishes database grants from RLS policies and supports explicit review/testing of authorization behavior.
- Microsoft Entra RBAC guidance emphasizes role-based access, privileged role separation, access review, and limiting sensitive operations.
- Contentful's environment/permission model is useful prior art for separating environments and limiting privileged changes.
- Existing marketplace/control-plane patterns reviewed in earlier messages (including Shopify/GitHub role models) reinforce using role-scoped administrative surfaces and keeping high-impact actions behind server-authoritative controls.

VELORA DECISION:
- Reuse these principles, not their product-specific permission names.
- Keep Production protected.
- Keep role determination in canonical user_roles / role helpers.
- Keep authorization inside server-side contracts.
- Keep auditability close to privileged state transitions.
- Avoid inventing a new permission taxonomy unless the existing role model proves insufficient for a concrete observed requirement.
- Avoid making Owner a manual approval step for automated routine flows.

### 91. Message 9 Browser / Preview Evidence
CLASSIFICATION: SOURCE PASS / DEPLOYMENT SIGNAL PRESENT / BROWSER PASS NOT EVIDENCED

OBSERVED:
- The Message 9 code change is committed as c4fe4dfdb817a7ca46dbfe2a664a8fea2f9350a8.
- GitHub combined commit status reports Vercel = success for the commit.
- Exact-commit GitHub workflow-run lookup returned no workflow runs for c4fe4dfdb817a7ca46dbfe2a664a8fea2f9350a8.
- Vercel success is deployment/platform status, not Browser Gate proof.
- TinyFish/browser automation has historically been unavailable in this track due to the external wallet/tool limitation; therefore no Browser PASS is claimed.

BROWSER TARGETS REMAIN OPEN:
- owner authentication: customer denied, seller denied, admin behavior as designed, owner succeeds
- owner open -> close -> reopen without refresh
- #owner route entry/re-entry after leaving other platforms
- Owner Dashboard shell and navigation
- Sellers moderation and suspension actions
- Products moderation
- Orders exception surface
- Users governance surface
- Audit Logs visibility
- Promotions/Coupons/Gift Cards
- Trust & Compliance
- Legal section visibility and Owner-only Publish button
- non-Owner cannot publish legal
- Owner cannot bypass legal backend requirements
- refresh/mobile/Arabic-English behavior
- Release Control + launch-gate visibility where exposed

### 92. Message 9 Execution Classification
CLOSED-DONE:
- Legal backend architecture and server-side hash/publication controls, subject to the absence of approved current legal content.
- Current legal public read RLS shape for published/effective documents.
- Explicit Owner-only server authorization for legal publication.
- Existing Owner-only server authorization for gift-card issuance.
- Current role enum discovery: customer / seller / admin / owner.
- Current staff guard discovery: admin OR owner.
- Concrete Owner route no-op gap at source level.
- Canonical Owner opener wiring at source level.
- Existing Legal UI made reachable from canonical Admin/Owner navigation at source level.
- No duplicate governance/legal/permission engine introduced.

OPEN / NOT EVIDENCED:
- FULL OWNER DASHBOARD.
- Complete Admin-vs-Owner privilege separation policy for every high-impact operation.
- Full Owner browser gate.
- Full legal Browser flow.
- Current published legal content approved by Legal/Owner for any real launch.
- Any claim that the DRAFT legal pack is publishable.
- Complete owner notification/exception workflow coverage.
- Full privileged-action audit matrix including negative tests for each role.
- Unpublish/legal rollback UX if later business/legal policy requires it.
- Payment/provider/production and all Message 8 carry-forward items.

PENDING:
- Production infrastructure and backup/rollback readiness remain pending.
- Owner/legal release-readiness remains dependent on real legal approval and launch-control evidence.
- Current provider settlement and Browser tooling evidence remain pending/blocked per Message 8.

BLOCKED:
- payment_provider remains BLOCKED / REQUIRED.
- webhook_verification remains BLOCKED / REQUIRED.
- shipping_provider remains BLOCKED / NOT REQUIRED.
- Browser/provider evidence may remain blocked by external test tooling; do not convert that into code failure or browser pass.

INFERRED:
- The safest immediate Owner/Legal move is to strengthen reachability around already-canonical contracts rather than create a parallel Owner platform.
- The current Owner role naturally acts as the governance superset of Admin because velora_is_staff() currently includes owner; whether selected actions should eventually be Owner-only is a policy decision, not a code assumption.

HYPOTHESIS / DISALLOWED CLAIMS:
- Do not claim that every staff action should be Owner-only.
- Do not claim the current shared Admin/Owner shell constitutes a complete Owner dashboard.
- Do not claim legal publication is ready merely because the publish RPC exists.
- Do not claim the historical legal_documents=0 snapshot is still the current DB state.
- Do not claim Browser PASS from Vercel success or source inspection.
- Do not claim Production safety from Restore-Test DB evidence.

### Message 9 Carry-Forward — Nothing Dropped
The following remain active from earlier Messages and must continue into Message 10/11 and beyond:
- canonical cart + legacy visible cart adapter; no cart rewrite.
- routine -> cart canonical adapter and Browser evidence where still applicable.
- checkout canonical path and stale visual shipping calculation observation.
- manual shipping; no required external carrier integration.
- variant inventory reconciliation and failed-payment release.
- legacy order_items.status contract mismatch; do not add a status column casually.
- abandoned pending-order/reservation policy remains OPEN; do not invent a TTL.
- seller product lifecycle; seller delete remains prohibited.
- seller post-approval re-review policy remains OPEN.
- Seller Dashboard re-entry remains Browser-gated.
- seller subscription lifecycle/UI/provider/browser policy gaps.
- seller advertising reporting/attribution/pricing/provider/browser gaps.
- commission policy/refund treatment.
- payout execution/provider/reconciliation evidence.
- promotion free_shipping/stacking/targeting/economics/reversal policy.
- gift-card refund/cancel accounting/expiry/browser evidence.
- returns customer UX/refund allocation/provider refund/return-window policy.
- notifications browser delivery/push evidence.
- Beauty Passport V2 / Routine / Recommendation browser evidence.
- customer Recommendation UX.
- customer Beauty AI remains NOT DONE / roadmap; do not introduce AI engine here.
- Paymob Case C browser/live sandbox completion.
- Paymob Case D webhook-failure replay/reconciliation.
- payment_provider and webhook_verification launch gates remain blocked.
- production_infra and rollback_backup remain pending.
- Production remains frozen.
- research before build remains mandatory.
- Action Flow remains parallel across the entire platform.

### Message 9 Evidence Ledger
L1 SOURCE:
- current canonical Admin/Owner source in src/scripts/12-localization.js
- platform routing source in src/scripts/63-platform-router.js
- existing Legal UI in src/scripts/00-localization.js
- existing Release Control in src/scripts/11-admin.js

L2 DB:
- current Restore-Test legal documents, legal acceptances, audit logs, role counts, role helper definitions, function definitions, RLS policies.

L3 ACL/RLS:
- user_roles role model and RLS
- Legal read policies
- audit_logs staff-read policy
- Owner-only legal publish contract
- Owner-only gift-card issuance contract
- staff-protected governance writers

L4 NEGATIVE / TRANSACTION PATH:
- Message 9 did not fabricate a new mutation test where no new DB contract required it.
- Existing backend contract checks remain the source of authority.
- Dedicated unauthorized-role negative browser/DB tests are OPEN where not yet evidenced.

L5 CI:
- no workflow run attached to commit c4fe4dfdb817a7ca46dbfe2a664a8fea2f9350a8.

L6 PREVIEW/DEPLOYMENT:
- GitHub combined Vercel status = success for c4fe4dfdb817a7ca46dbfe2a664a8fea2f9350a8.
- This is deployment signal only.

L7 BROWSER:
- NOT EVIDENCED.

L8 PROVIDER:
- not applicable to Legal/Owner UI itself; payment/provider evidence remains carried from Message 8 and is still open/blocked.

L9 PRODUCTION:
- NOT EVIDENCED; Production remains frozen.

### Message 9 Next Execution Order
1. Continue the full Master Handoff rather than treating Message 9 as a reset.
2. Keep Owner Dashboard = OPEN until the complete governance surface is audited.
3. Continue auditing existing canonical control surfaces before adding anything new.
4. For every Owner-sensitive action, build the actual role/guard matrix from code + DB first.
5. Research any missing control-plane pattern before implementing a gap.
6. Use Browser Gate only for claims that require UI/runtime evidence.
7. Keep Legal fail-closed until real approved/published legal content exists.
8. Continue Message 8 payment/provider lane in parallel; Message 9 does not supersede it.


## Message 10/11 — Security + Auth + Localization + Operations

### Message 10 master conditions
1. HANDOFF COMPLETENESS — Message 10 is appended to the same Master Execution Plan. Nothing from Messages 2/11 through 9/11 is removed, reset, silently reclassified, or forgotten. All prior OPEN / BLOCKED / PENDING / NOT EVIDENCED items remain carry-forward.
2. RESEARCH BEFORE BUILD — use targeted remediation only. Inspect actual contracts, prior art, Supabase guidance, and real runtime evidence before changing security/auth/localization/operations. Do not build a new security engine, permission engine, notification service, accounting ledger, shipping backend, or localization engine merely to make a checklist look complete.
3. ACTION FLOW IN PARALLEL — Detect -> Decide -> Execute -> Verify -> Recover/Escalate stays active across security, authentication, localization, legal, seller, commerce, payments, trust, financial operations, and release control. Normal operation should remain automated wherever canonical contracts support it; Owner/Staff intervention is reserved for genuine policy, fraud/trust, legal, financial exception, provider, or release boundaries.

### 90. Security / RBAC — Current Targeted Advisor Audit
CLASSIFICATION: OPEN SECURITY HARDENING / NO BLANKET REVOCATION JUSTIFIED

CURRENT SUPABASE SECURITY ADVISOR OBSERVED FACTS (Restore-Test, 2026-09-28):
- rls_enabled_no_policy: 6 findings.
  - private.beauty_catalog_revision
  - private.beauty_recommendation_rate_events
  - public.billing_instruments
  - public.paymob_card_tokenization_sessions
  - public.regional_pricing
  - public.seller_subscription_renewal_jobs
- extension_in_public: 1 WARN for pg_net installed in public schema.
- anon_security_definer_function_executable: 7 WARNs for public read-style SECURITY DEFINER functions.
- authenticated_security_definer_function_executable: 215 WARNs.
- auth_leaked_password_protection: 1 WARN — leaked password protection is disabled.

TARGETED EXPOSURE CHECK:
- Current direct table grants for anon and authenticated are FALSE for:
  - billing_instruments
  - paymob_card_tokenization_sessions
  - regional_pricing
  - seller_subscription_renewal_jobs
- RLS is enabled on all four of those public tables.
- Therefore the Advisor warning about RLS enabled with no policy does NOT by itself establish public Data API exposure for these four tables.
- Do not add blanket policies or blanket revocations simply to remove the lint warning. Review each table's intended access model first.

SECURITY DEFINER SYSTEM-WIDE OBSERVATION:
- Current Restore-Test has 251 public SECURITY DEFINER functions in total.
- 215 are executable by authenticated.
- 7 are executable by anon.
- 0 of the 251 definitions are missing an explicit SET search_path according to the targeted metadata check.
- A heuristic identified 16 authenticated-executable functions without an obvious auth.uid / velora_is_staff / velora_has_role token. This is a review queue, not proof of vulnerability: some are intentionally public-style reads or wrappers that delegate to guarded canonical functions.
- Therefore classification remains TARGETED REMEDIATION, not "251 vulnerabilities."

TARGETED SENSITIVE FUNCTION REVIEW:
- Inspected current definitions for payment, cart, legal, seller, product, payout, release, integration, AI-governance, localization, and order-state control functions.
- The reviewed SECURITY DEFINER functions use pinned search_path settings and explicit authentication/role checks where their action is privileged.
- High-impact writers such as seller/product/order governance, payout execution, release control, integration control, AI decision review, and legal publication include staff/owner guards as appropriate to their current contracts.
- Current payment RPCs remain authenticated-only at the Data API privilege layer where previously hardened.
- velora_publish_legal_document remains explicit Owner-only.
- velora_issue_gift_card remains explicit Owner-only.
- No second permission engine was introduced.

INTENTIONAL PUBLIC-STYLE SECURITY DEFINER CANDIDATES:
The current Advisor's seven anon-executable SECURITY DEFINER functions are all read-oriented in the inspected definitions:
- velora_get_active_seller_ads
- velora_get_fx_rate
- velora_get_i18n_catalog
- velora_get_localized_content
- velora_get_marketplace_catalog
- velora_get_required_legal_documents
- velora_list_active_promotions

OBSERVED:
- These functions are STABLE/read-style in the inspected definitions, use pinned search_path, and do not contain the normal write verbs identified by the targeted scan.
- Some are expected public marketplace reads by design (catalog, FX, active ads, active published legal documents, promotions, localization).

OPEN SECURITY REVIEW QUEUE:
- Explicitly determine whether velora_get_commission_rate(target_seller_id) should be callable by any authenticated user because it currently has auth EXECUTE without a direct auth/role guard in its definition.
- Explicitly review the small set of "no obvious auth token" authenticated functions that are not clearly public reads or guarded wrappers.
- Review the pg_net public-schema warning before any extension move; do not relocate an extension without compatibility/dependency proof.
- Review the six no-policy tables against their actual service/data-access contract before choosing a targeted policy or leaving them intentionally service-only.
- Do not treat the Advisor's raw count as the number of actionable vulnerabilities.

RESEARCH-FIRST BASIS:
- Current Supabase documentation recommends least-privilege execution grants, careful review of SECURITY DEFINER functions, pinned search paths, and RLS for exposed tables. citeturn206077search0turn206077search2turn206077search5
- Supabase security guidance explicitly describes revoking function EXECUTE case-by-case rather than default blanket revocation when public functions are intentional. citeturn206077search0turn206077search8
- OWASP authorization guidance emphasizes least privilege and deny-by-default rather than permissive defaults. citeturn206077search1

### 91. Authentication Configuration
CLASSIFICATION: OPEN FINAL READINESS ITEM

OBSERVED FACT:
- Supabase Security Advisor currently reports auth_leaked_password_protection as WARN: leaked password protection is disabled.
- Current Supabase password-auth guidance describes leaked-password protection as a security control for password-based authentication. citeturn206077search4turn206077search9
- Current project metadata confirms Restore-Test is ACTIVE_HEALTHY on PostgreSQL 17.6.1.166, but it does not expose every hosted Auth configuration switch required for final readiness review.
- Therefore final Auth configuration is NOT fully evidenced.

OPEN:
- leaked-password protection enablement/review.
- final email verification/session/password policy review.
- any final production Auth settings, redirect/origin, recovery, and sensitive-session controls required by the actual production deployment model.
- No production-readiness claim until the final Auth configuration is explicitly verified.

RULE:
- Do not infer production Auth readiness from successful login tests alone.
- Do not enable a risky production-facing Auth change on Restore-Test without understanding its user-impact contract.

### 92. Localization — Script Authority
OBSERVED FACT:
Current intended script order remains:
00-localization.js -> 10-localization.js -> 12-localization.js -> 50-localization.js -> 51-localization.js -> 56-s2d-admin.js -> 63-platform-router.js

Current roles:
- 00-localization.js: legacy locale API/state and compatibility layer.
- 50-localization.js: global locale/country/currency/timezone state wrapper and server context persistence.
- 51-localization.js: V5 i18n kernel and current language mutation authority.

### 93. Localization — Current Runtime Contract
CLASSIFICATION: SOURCE-LEVEL HARDENING PRESENT / BROWSER PARITY OPEN

OBSERVED FACT:
- 51-localization.js exposes window.VELORA_V5_SET_LANGUAGE.
- Its setLang(code) validates the locale, calls paintLocale(locale) immediately, and only then starts asynchronous persistence (persistLocale) and catalog loading (loadDbCatalog).
- paintLocale() synchronously commits locale state, localStorage, document language, direction, translation rendering, and the existing locale-change events.
- Therefore the source currently satisfies the key "do not await before changing what the user sees" invariant.
- 50-localization.js loadContext() explicitly avoids calling the legacy language setter and preserves a locally chosen valid locale instead of allowing server context to overwrite a newer local choice.
- 50-localization.js still contains a compatibility setVeloraLanguage wrapper, but 51-localization.js loads after it and then assigns window.setVeloraLanguage = setLang. Thus the final loaded browser API is V5's synchronous setter.
- Existing 51-localization.js still contains a MutationObserver and render-capture compatibility mechanism. This predates Message 10; do not add another MutationObserver or refactor this architecture blindly.

IMPORTANT STATUS:
- Source-level V5 authority is OBSERVED.
- Browser/re-entry/mobile/Arabic-English runtime behavior is NOT EVIDENCED.
- The earlier proposed V5-authoritative direction should therefore be treated as "implemented at source level, Browser proof still required", not as a Browser PASS.
- Do not claim the race is fully closed until the current Browser Gate proves locale persistence and re-render behavior under realistic navigation/renders.

TARGETED BROWSER TESTS:
- EN -> AR -> EN -> refresh.
- locale switch during active Seller/Admin/Owner surfaces.
- locale switch followed by platform close/reopen.
- locale switch while dynamic HTML is rendered.
- country/currency/date locale persistence after refresh.
- language selection with signed-out and signed-in states.
- mobile/RTL layout behavior.
- no stale server-context overwrite after a new local user choice.

### 94. Season Engine
CLASSIFICATION: CLOSED-DETERMINISTIC / BROWSER BEHAVIOR OPEN

OBSERVED FACT:
- Canonical season helper is private.beauty_season_for_date(p_date).
- It maps Dec/Jan/Feb -> winter, Mar/Apr/May -> spring, Jun/Jul/Aug -> summer, Sep/Oct/Nov -> autumn.
- Current project date is 2026-09-28, so the deterministic calendar currently resolves to autumn.
- private.velora_beauty_context() uses Africa/Cairo as its time zone and derives the season from this calendar helper.
- Season is deterministic context; it is not an AI-generated output.
- No new season engine is justified.

### 95. QA Catalog
CLASSIFICATION: OBSERVED RESTORE-TEST SNAPSHOT

CURRENT approved EGP QA products:
- Test Vitamin C Serum — stock 23 — EGP 140
- QA Seed Cleanser — stock 13 — EGP 100
- QA Seed Barrier Moisturizer — stock 19 — EGP 120
- QA Seed Anti-Aging Treatment — stock 18 — EGP 160
- QA Seed SPF 50 Protect — stock 19 — EGP 100

CURRENT OBSERVED FACT:
- Exactly five approved EGP products were returned by the current QA query.
- This is a test-environment snapshot and must NOT be interpreted as the intended production catalog size or commercial assortment.

### 96. Product Image / Storage
CLASSIFICATION: OPEN / NOT EVIDENCED

CURRENT Restore-Test:
- product_images = 0
- storage.buckets = 0
- No proven canonical product-image upload RPC.

DECISION:
- Do not build Base64 storage, an arbitrary image service, a random upload API, or a second product-media model.
- Keep current HTTPS image URL contract.
- Revisit only when a real seller/customer upload requirement and a concrete Storage/RLS contract are evidenced.

### 97. Seller Shipping
CLASSIFICATION: CANONICAL FOUNDATION PRESENT

CURRENT Restore-Test:
- store shipping zones = 1
- store shipping rates = 1
- shipping carriers = 1
- shipping quotes = 0
- manual rates = 1
- Current carrier model remains velora_manual.
- Manual fulfillment is accepted as the launch model; no new carrier backend is justified by the current evidence.
- Maintain seller ownership rules and existing shipping page/RPCs.

### 98. Notifications
CLASSIFICATION: EXISTING CANONICAL SYSTEM / BROWSER DELIVERY OPEN

CURRENT Restore-Test snapshot:
- notifications = 38
- notification lifecycle jobs = 0
- push deliveries = 6
- push subscriptions = 3

RULE:
- Reuse existing notification lifecycle + push dispatcher architecture.
- Do not build another notification service or scheduler.
- Remaining Browser evidence for bell/read/push lifecycle/device behavior stays OPEN.

### 99. Financial Model
CLASSIFICATION: CANONICAL CROSS-SYSTEM CHAIN PRESENT / FULL E2E RECONCILIATION OPEN

Required conceptual chain:
Order -> Payment -> Commission -> Seller Earnings -> Payout Request -> Provider Execution -> Settlement -> Reconciliation

OBSERVED CURRENT SNAPSHOT:
- orders = 13
- payment_attempts = 36
- payments = 11
- commissions = 15
- payouts = 0
- seller_payout_items = 0
- ledger_entries = 2

RULES:
- Every stage retains its own state.
- "Payout eligible" is NOT equivalent to "paid."
- "Payment captured" is NOT equivalent to external settlement unless provider evidence proves settlement.
- Existing commission, payout, payment, ledger and webhook contracts remain authoritative.
- No new general-purpose ledger engine is justified.

OPEN:
- full browser/provider settlement proof.
- provider execution evidence for payouts.
- reconciliation drill across captured payment -> commission -> eligibility -> payout -> external execution -> ledger.
- refund/cancellation effects across financial objects.
- exceptions where provider state and local state disagree.

### 100. Promotion / Gift Card / Payment Interactions
CLASSIFICATION: CROSS-SYSTEM TESTING OPEN

Required future negative/positive matrix:
Promotion:
order creation -> discount calculation -> payment -> cancellation/refund -> redemption reversal rules

Gift Card:
redeem -> balance decrement -> payment-state relation -> cancellation/refund -> balance restoration if contract requires

Payment failure:
provider-start failure -> payment-attempt failure -> canonical inventory/order/payment/commission recovery

CURRENT SNAPSHOT:
- promotions = 0
- promotion_redemptions = 0
- gift_cards = 0
- gift_card_transactions = 0

RULE:
- Existing canonical RPC contracts define current behavior.
- Do not invent refund/reversal/accounting semantics merely to make the interaction matrix appear complete.
- Cross-system evidence must include failure handling and idempotency where applicable.
- Action Flow should automatically execute normal cross-system paths; Owner/Staff only enters genuine exceptions.

### 101. Legal / Checkout
CLASSIFICATION: CLOSED-FAIL-CLOSED CONTRACT / CONTENT READINESS OPEN

OBSERVED FACT:
- Normal checkout requires Terms of Service and Privacy Policy.
- Current applicable published legal set is absent because current legal rows are retired QA fixtures.
- Therefore checkout fails closed with the existing LEGAL_DOCUMENTS_NOT_PUBLISHED contract.
- This is intentional safety behavior, not a bug to be bypassed.
- No fake publication or "temporary" legal acceptance should be introduced.

### 102. Fraud / Trust
CLASSIFICATION: NORMAL AUTOMATED PATH + GOVERNED EXCEPTIONS

Owner/Staff human intervention is appropriate for:
- suspected fraud
- exceptional financial cases
- exceptional refunds
- account restrictions
- irreversible governance decisions

Normal transaction handling remains automated through canonical order/payment/trust/workflow contracts.

### 103. Auditability
CLASSIFICATION: ARCHITECTURE PRESENT / COVERAGE DRILL OPEN

High-impact state changes expected to remain auditable where the architecture already provides events:
- product status
- product availability
- payment transitions
- provider session binding
- webhook processing
- seller governance
- gift-card issuance
- legal publication
- financial exceptions
- suspension/account actions
- release control

OBSERVED:
- Multiple reviewed functions write explicit audit_logs records.
- audit_logs is staff-readable through the existing RLS policy.
- Do not add a second generic audit system.
- Remaining task is coverage verification: identify any high-impact canonical writer without an appropriate audit event and fix only when a real gap is proven.

### 104. Seller Advertising Accounting
CLASSIFICATION: OPEN POLICY / ACCOUNTING EVIDENCE

Still requires explicit classification of:
- campaign spend
- amount payable
- captured amount
- platform revenue
- seller earnings
- refund/reversal amount
- attribution metrics

RULE:
- Do not introduce a ledger schema just to populate a dashboard.
- Research prior marketplace advertising accounting models and inspect existing Velora payment/commission/ledger contracts first.
- Build only the smallest missing contract if an actual operational gap is proven.
- Do not assume ad campaign active means payment settled or recognized revenue.

### 105. Message 10 Action Flow — Parallel

SECURITY:
Detect Advisor finding
-> identify exposed object / intended audience
-> inspect grants
-> inspect RLS
-> inspect SECURITY DEFINER + search_path
-> inspect authorization checks
-> inspect side effects/audit
-> research current Supabase guidance
-> choose targeted remediation OR explicitly document intentional exposure
-> test
-> re-run Advisor
-> Browser Gate when UI-facing
-> recover/escalate for unresolved sensitive boundary

AUTH:
Detect auth configuration drift/readiness issue
-> compare current hosted configuration to required launch policy
-> apply only approved configuration change
-> verify login/signup/recovery/session behavior
-> verify negative/authz paths
-> record readiness evidence
-> escalate only for actual account/security policy decision

LOCALIZATION:
Detect locale change/request
-> resolve V5 locale state synchronously
-> paint locale + direction
-> persist asynchronously
-> load canonical translation catalog
-> refresh active surface
-> verify state survives navigation/refresh
-> recover to known locale without page-reload dependency

OPERATIONS:
Detect lifecycle signal
-> decide whether existing canonical automation already handles it
-> execute existing Action Flow / RPC / scheduler
-> verify resulting state
-> recover through existing idempotent path
-> Owner/Staff only on policy/financial/fraud/provider/release exception

FINANCIAL:
Detect order/payment/commercial transition
-> validate canonical order/payment state
-> apply existing promotion/gift-card/commission contracts
-> create/update payment state
-> propagate cancellation/failure/refund side effects through existing triggers
-> calculate payout eligibility only from finalized governed state
-> record payout execution only when external execution evidence exists
-> reconcile
-> escalate provider/financial mismatch to human governance

NO DUPLICATE ENGINE RULE:
- Security uses Supabase Advisor + existing DB ACL/RLS.
- Auth uses Supabase Auth + existing session/role model.
- Localization uses V5 kernel + existing global-context layer.
- Notifications use existing lifecycle/push system.
- Financials use existing order/payment/commission/payout/ledger contracts.
- Shipping uses existing manual carrier foundation.
- Promotions/gift cards use existing canonical commercial engines.
- Do not create parallel infrastructure merely to "complete" the checklist.

### Message 10 Evidence Ledger
L1 SOURCE:
- current security-sensitive database function definitions
- 50-localization.js and 51-localization.js
- current operational scripts/control surfaces

L2 DB:
- current Security Advisor findings
- public-table grants/RLS checks
- current QA catalog
- season helper
- storage/product-images state
- shipping state
- notifications state
- financial counts

L3 ACL/RLS:
- targeted SECURITY DEFINER review
- authenticated/anon EXECUTE review
- no-policy table grant review
- existing role/staff/Owner guards
- Legal/Owner and payment control boundaries carried forward

L4 NEGATIVE / TRANSACTION:
- Message 10 added no speculative mutation.
- Previous Message 8 negative-path evidence remains authoritative and carried forward.
- New unauthorized-role drills for the remaining security review queue remain OPEN.

L5 CI:
- no dedicated Message 10 CI run is claimed.
- Existing Vercel status from the Message 9 source change remains deployment signal only.

L6 PREVIEW:
- Message 9 code commit has a successful Vercel combined status.
- No new Message 10 Preview PASS is claimed because no new code change was required.

L7 BROWSER:
- NOT EVIDENCED for Security/Auth/Localization/Operations current gates.
- Browser Gate remains mandatory before claiming current runtime parity.

L8 PROVIDER:
- Payment settlement/provider evidence remains OPEN/BLOCKED from Message 8.
- Seller ad accounting/provider evidence remains OPEN.

L9 PRODUCTION:
- NOT EVIDENCED; Production Supabase remains FROZEN.
- Final Auth configuration, infrastructure, backup/rollback remain readiness work.

### Message 10 Execution Classification
CLOSED-DONE / VERIFIED:
- Targeted Security Advisor inventory established.
- No missing SET search_path found in the 251 public SECURITY DEFINER functions reviewed by the metadata heuristic.
- Known public-style anon SECURITY DEFINER candidates were inspected and are read-oriented with pinned search_path.
- Four flagged public tables have RLS enabled and no anon/authenticated table grants, so no immediate Data API exposure was established by the targeted check.
- Current V5 localization source already commits locale before awaits.
- Deterministic season engine confirmed.
- Current five-product QA EGP snapshot confirmed.
- Current zero-image/zero-bucket Storage snapshot confirmed.
- Manual shipping foundation confirmed.
- Existing notification system and current counts confirmed.
- Current financial object counts confirmed.
- Legal checkout fail-closed behavior confirmed.

OPEN / NOT EVIDENCED:
- final Auth configuration/readiness
- leaked password protection enablement/review
- targeted review of the 16 "no obvious auth guard" SECURITY DEFINER candidates
- decision for velora_get_commission_rate exposure scope
- pg_net public-schema warning review
- six no-policy table contracts
- complete high-impact audit coverage
- current Browser localization race/runtime proof
- Browser proof for Security/Auth/Operations surfaces
- seller ad accounting classification
- financial cross-system reconciliation drill
- promotion/gift-card/payment interaction drills

BLOCKED / PENDING:
- payment_provider remains BLOCKED / REQUIRED
- webhook_verification remains BLOCKED / REQUIRED
- production_infra remains PENDING / REQUIRED
- rollback_backup remains PENDING / REQUIRED
- Browser/provider tooling limitations remain carried forward

INFERRED:
- Current security posture is better treated as a finite targeted-remediation queue than as a blanket "SECURITY DEFINER = vulnerability" condition.
- The current Localization architecture already reflects the intended V5-before-await invariant at source level, but runtime/browser evidence is still needed to close the operational claim.
- The least disruptive operational path remains reuse of canonical Action Flow and existing control-plane components.

HYPOTHESIS / DISALLOWED:
- Do not claim the 251 SECURITY DEFINER warnings are 251 vulnerabilities.
- Do not claim the six no-policy tables are exposed without a grant.
- Do not claim leaked-password protection is enabled.
- Do not claim the locale race is Browser-resolved.
- Do not claim payment capture equals external settlement.
- Do not claim payout eligibility equals payout execution.
- Do not claim the QA catalog is the production assortment.
- Do not claim Product Image upload exists.
- Do not claim Browser PASS from source/DB/Vercel evidence.

### Message 10 Carry-Forward
Everything from Messages 2/11 through 9/11 remains active:
- cart canonical/legacy adapter; no cart rewrite.
- routine-to-cart adapter and Browser evidence status.
- checkout canonical path and stale visual shipping formula observation.
- manual shipping accepted; no required external carrier integration.
- inventory/variant reconciliation and failed-payment release.
- legacy order_items.status mismatch; no casual status column addition.
- abandoned pending-order/reservation policy open; no invented TTL.
- seller product lifecycle; Seller Delete prohibited.
- post-approval seller re-review policy open.
- Seller Dashboard re-entry Browser-gated.
- subscription policy/runtime/provider/browser gaps.
- ads reporting/attribution/pricing/provider/accounting gaps.
- commission policy/refund treatment.
- payout provider execution/reconciliation.
- promotions free_shipping/stacking/targeting/economics/reversal.
- gift-card refund/cancel accounting/expiry/Browser.
- returns UX/refund allocation/provider refund/window.
- notifications Browser push/delivery.
- Beauty Passport V2 / Routine / Recommendation browser evidence.
- customer Recommendation UX.
- customer Beauty AI NOT DONE / roadmap.
- Paymob Case C Browser/live sandbox completion.
- Paymob Case D webhook-failure replay/reconciliation.
- Owner Dashboard complete governance/browser/negative-path coverage.
- Legal approved/published content readiness and Browser flow.
- payment_provider and webhook_verification blocked.
- production_infra and rollback_backup pending.
- Production remains frozen.
- Research-before-build remains mandatory.
- Action Flow remains parallel.

### Continuation Update — 2026-09-28 — Runtime Parity

CLASSIFICATION: CLOSED-DONE AT SOURCE/DB CONTRACT FOR LEGACY ORDER-ITEM STATUS DEPRECATION; SELLER DASHBOARD RE-ENTRY REMAINS OPEN / NOT EVIDENCED

OBSERVED FACT:
- The migration `supabase/migrations/20260928211000_deprecate_legacy_order_item_status_rpc.sql` was previously created on the historical `audit/full-gate-2026-09-25` branch. It has now been reconciled onto the current `audit/runtime-parity-2026-09-28` continuation branch in commit `5859fc1cff27ba7ae64f6ced93c1d3206eebb717`.
- Restore-Test currently has `public.velora_update_order_item_status(uuid,text,text)` present with ACL execute granted only to `postgres` and `service_role`; `anon` and `authenticated` execution are not granted.
- Restore-Test currently has no `public.order_items.status` column. The legacy function comment explicitly marks it DEPRECATED and directs clients/Data API not to call it.
- This closes the source/DB parity gap for the deprecation decision without adding an `order_items.status` column and without touching Production.
- The GitHub combined status for commit `5859fc1cff27ba7ae64f6ced93c1d3206eebb717` currently reports a Vercel failure whose target indicates `upgradeToPro=build-rate-limit`. This is deployment/platform capacity evidence, not evidence that the migration source is incorrect.
- No new post-change Browser PASS or Paymob CI PASS is claimed from this commit.

INFERRED:
- The legacy order-item status contract is now most accurately tracked as deprecated/closed for client execution at L1-L4, while the historical incompatible implementation remains retained for forensic/compatibility purposes.
- Seller Dashboard re-entry must not be treated as fixed merely because current source wiring is internally consistent.

SELLER DASHBOARD RE-ENTRY — CURRENT SOURCE OBSERVATION:
- `src/scripts/12-localization.js` supplies the canonical seller opener and assigns `window.openSellerPlatform=openCanonicalSeller`.
- `src/scripts/63-platform-router.js` loads after that assignment and captures the canonical opener for its route activation.
- The canonical seller UI close button uses `window.VELORA_CLOSE_SELLER()`, while the router separately exposes `window.closeSellerPlatform()`. These are distinct control surfaces.
- This split is an OBSERVED source-level investigation target, not a proven root cause of the historical re-entry failure.
- Do not add a new routing engine, MutationObserver, arbitrary click listeners, cache workarounds, or speculative refactors without browser reproduction.

NEXT EVIDENCE:
- Browser Gate must reproduce: Seller Dashboard open -> Back to Store/close -> re-enter in the same session without refresh.
- Record hash before open, hash while seller is open, hash after close, auth/session presence, seller shell visibility, and whether the second activation reaches `canonicalSellerSection('dashboard')`.
- Then test re-entry through both the platform switcher and any existing Seller Dashboard entry point, so we can identify the exact control path before making the smallest safe fix.

ACTION FLOW:
Detect route/re-entry failure -> verify hash/auth/session state -> execute the existing canonical seller activation -> verify visible seller shell and dashboard -> controlled route re-sync only when the observed failure is route state -> escalate only when auth/session is genuinely missing.

### Continuation Governance — Owner Non-Negotiables (2026-09-28)

These three operating conditions are permanent and apply to the entire Velora execution track:

1. HANDOFF COMPLETENESS — The full Master Handoff remains authoritative across the entire platform. All 60+ tracked items and every CLOSED-DONE, OPEN, BLOCKED, PENDING, NOT EVIDENCED, INFERRED, and HYPOTHESIS classification, plus dependencies, permissions, evidence layers, policy decisions, provider state, Browser Gate state, Production freeze, Action Flow carry-forward, and recovery/escalation paths must remain visible and must not be silently dropped when execution moves between workstreams.

2. RESEARCH / REUSE BEFORE BUILD — For every new gap: FIND the existing implementation and contract -> RESEARCH relevant prior art and current platform/provider guidance (using multiple sources when needed) -> COMPARE -> REUSE / ADAPT the existing Velora path whenever it satisfies the need -> PROVE the gap is real -> define the smallest required contract -> BUILD only the missing piece -> verify again. Do not build a duplicate engine, parallel state machine, speculative schema, second cart/payment architecture, or feature solely for the sake of construction.

3. ACTION FLOW IN PARALLEL — Every material workflow must continue as EVENT -> AUTH/ROLE -> GUARD -> VALIDATION -> CANONICAL STATE TRANSITION -> AUTOMATIC SIDE EFFECTS -> AUDIT -> RETRY/IDEMPOTENCY/DEDUPE -> NEXT EVENT -> RECOVER/ESCALATE ONLY WHEN NECESSARY. Normal platform operation should be automatic through existing RPCs, triggers, jobs, and canonical UI contracts. Owner/Staff intervention is reserved for governance, legal publication, fraud/trust, financial exceptions, provider disputes/ambiguity, irreversible actions, policy choices, and release control.

EXECUTION NOTE:
- These conditions do not close any product or evidence gate by themselves; they govern how all future work is performed and recorded.
- Production remains FROZEN.

### Continuation Security Review — 2026-09-28

CLASSIFICATION: TARGETED SECURITY QUEUE ADVANCED; NO CODE/SCHEMA CHANGE REQUIRED FROM THIS REVIEW

OBSERVED FACT:
- The four public-schema Security Advisor "RLS enabled with no policy" tables currently have no SELECT privilege for `anon` or `authenticated`: `billing_instruments`, `paymob_card_tokenization_sessions`, `regional_pricing`, and `seller_subscription_renewal_jobs`.
- The reviewed functions that reference those four tables are all restricted to `postgres` / `service_role` EXECUTE in the current Restore-Test ACL snapshot.
- The two private-schema Advisor findings, `private.beauty_catalog_revision` and `private.beauty_recommendation_rate_events`, also have no SELECT privilege for `anon` or `authenticated`; their current direct table grants do not establish Data API exposure.
- Therefore the current Advisor "RLS enabled / no policy" findings do not, by themselves, establish client Data API exposure for these six tables. Supabase's current API guidance treats table grants and RLS as separate controls and recommends explicit least-privilege grants; SECURITY DEFINER functions exposed through the Data API must likewise have deliberately scoped EXECUTE privileges. citeturn115976search0turn115976search3turn115976search2
- `velora_get_commission_rate(uuid)` remains executable by `authenticated` and `service_role`, is SECURITY DEFINER, and is directly used by the canonical server-side `velora_create_order(...)` path. No direct caller for it was found in the currently inspected key frontend runtime files. Its cross-seller read scope is a business/security-policy decision; no permission change is made without that decision.
- The current current count snapshot is 24 anon-executable public functions and 238 authenticated-executable public functions; this is an inventory signal, not a vulnerability count.

INFERRED:
- The six no-policy findings are currently best treated as contract-review items rather than proven Data API exposures.
- For `velora_get_commission_rate`, a narrowly targeted EXECUTE decision is preferable to either a blanket revoke or leaving the scope unreviewed; no change is justified until intended client visibility is confirmed.

NEXT ACTION:
- Keep the four public tables service-only unless a concrete consumer contract requires client access; if one does, add the smallest RLS policy + grant pair required by that contract.
- Keep the two private tables non-API-facing unless a concrete internal access path requires otherwise.
- Obtain the owner/business decision on whether an authenticated client may call `velora_get_commission_rate(target_seller_id)` for an arbitrary seller. If not required, the smallest safe remediation is to revoke `authenticated` EXECUTE while retaining internal server-side callers. Do not apply this revocation yet.
- Continue the remaining targeted Security Advisor queue without blanket revocation or blanket policy creation.

ACTION FLOW:
Detect security finding -> identify actual consumer -> verify schema/ACL/RLS -> classify intended exposure -> smallest targeted grant/revoke/policy -> negative-path proof -> re-run Advisor -> Browser Gate only when UI-facing -> recover/escalate for unresolved sensitive boundary.

### Continuation Infrastructure Review — pg_net — 2026-09-28

CLASSIFICATION: DEPENDENCY CONFIRMED; RELOCATION NOT JUSTIFIED

OBSERVED FACT:
- Restore-Test has extension `pg_net` version `0.20.4` installed in schema `public`.
- The active `cron.job` entry `velora-paymob-reconciliation` runs every five minutes and directly calls `net.http_post(.../velora-paymob-reconciliation-restore-test...)`.
- Therefore the Security Advisor `extension_in_public` warning corresponds to a live operational dependency, not an unused extension artifact.
- A metadata scan of public SECURITY DEFINER function definitions did not find `net.%` references; the dependency is instead in the `cron.job` command itself.
- No extension relocation was performed. Moving pg_net would require a compatibility/dependency plan and re-verification of the reconciliation scheduler.

INFERRED:
- The least disruptive posture is to retain the current pg_net placement for now and keep the Advisor warning as an OPEN infrastructure review item rather than performing a speculative migration.
- Any future relocation must preserve the cron/http dependency and be proven at the database and scheduler layers before considering Browser/provider effects.

ACTION FLOW:
Detect Advisor warning -> identify live dependency -> verify scheduler contract -> research compatible relocation path -> smallest safe infrastructure change only if required -> re-run cron/reconciliation proof -> re-run Advisor -> escalate only for hosted-extension/platform constraints.

### Continuation Commercial Visibility — Commission Rate — 2026-09-28

CLASSIFICATION: PARKED / LOW PRIORITY; INTERNAL FINANCIAL CALCULATION REMAINS CANONICAL

DIRECTION:
- Treat velora_get_commission_rate(target_seller_id) as an internal financial calculation, not a customer-priority surface.
- Do not create a new customer-facing commission-rate feature merely because the RPC exists.
- Do not revoke authenticated EXECUTE yet; first prove all internal callers and run a negative-path check so canonical order creation remains unaffected.

RESEARCH NOTE:
- Major marketplaces publish seller-facing fee schedules/tools while keeping the actual transaction calculation governed by seller economics and platform contracts. This is useful prior art, but not a direct Velora contract.
- Amazon publishes referral-fee schedules by category and Seller Central fee tools.
- eBay publishes selling-fee tables and seller financial-statement views.
- Etsy shows sale-based fees in the seller Payment account.
- Future seller-facing fee disclosure should therefore be a deliberate product/UX contract, separate from this internal cross-seller RPC.

PRIORITY:
- This is below launch-critical payment/provider evidence, production readiness, rollback/backup, legal readiness, security hardening, Browser Gate evidence, and core marketplace correctness.

### Continuation Financial Visibility — Commission Rate — 2026-09-28

CLASSIFICATION: CLOSED-DONE AT CURRENT SOURCE/DB/ACL FOR CLIENT EXECUTION SCOPE

OBSERVED FACT:
- Owner direction is that arbitrary cross-seller commission-rate lookup is not a customer-priority surface.
- Current Restore-Test `velora_get_commission_rate(uuid)` is used by canonical `velora_create_order(...)` for server-side commission calculation.
- Current DB function-reference inspection found the canonical `velora_create_order(...)` as the direct current caller of `velora_get_commission_rate`; no additional public function caller was found in the inspected database definitions.
- Current key frontend runtime files inspected do not call `velora_get_commission_rate` directly.
- A targeted migration was added to the current continuation branch: `supabase/migrations/20260928214500_scope_commission_rate_rpc_internal.sql`, commit `36af4a2ef3a2a1e719816aa405eae03b2477b09a`.
- Restore-Test applied the migration successfully. Current ACL is `postgres=X/postgres,service_role=X/postgres`; `anon` and `authenticated` EXECUTE are false.
- An owner-level direct probe still returned the canonical fallback result `12.5`, confirming the function remains callable in its internal/owner execution context.
- A negative-path probe under `authenticated` failed with PostgreSQL `42501 permission denied for function velora_get_commission_rate`, confirming the client role boundary.
- No new customer-facing commission-rate UI was added.

INFERRED:
- This resolves the documented question without introducing a duplicate financial calculation path or changing the canonical order calculation.
- Any future seller-facing fee disclosure should be a separate product/UX contract; the internal cross-seller calculation RPC should not be used as a public data contract.

REMAINING EVIDENCE:
- Browser evidence is not required for the ACL-only control itself.
- Re-run the relevant CI/security checks as part of the next available gate; do not infer a full CI/Browser/Production pass from this database change.

ACTION FLOW:
Order/commercial event -> canonical order validation -> internal commission calculation -> commission/ledger state transition -> audit -> reconciliation. Client direct commission lookup is denied by ACL; no human intervention is required in the normal path.

### Continuation Auth / Deployment Readiness — 2026-09-28

CLASSIFICATION: OWNER-HOSTED-CONFIGURATION ACTION REQUIRED; NO APPLICATION CODE CHANGE JUSTIFIED

OBSERVED FACT:
- Restore-Test organization `Maha Beauty` is currently on the Supabase `free` plan.
- Current Supabase documentation states leaked-password protection is available on Pro Plan and above, and the current pricing page lists leaked password protection as not included on Free. citeturn354297search0turn354297search2
- Therefore the existing Security Advisor `auth_leaked_password_protection` warning cannot be closed by application code or a speculative database migration while the organization remains on Free.
- Current Restore-Test project status remains ACTIVE_HEALTHY on PostgreSQL 17.6.1.166.
- Current Vercel deployment evidence includes a `build-rate-limit` upgrade-to-Pro signal. Current Vercel documentation says Hobby is usage-capped and Pro provides additional usage capacity; Vercel's deployment-disabled guidance also identifies upgrading to Pro as a recovery path when account limits are hit. citeturn127111search0turn127111search6
- We have not independently asserted the Vercel team's exact plan from the project metadata connector; the deployment signal is the observed evidence.

OWNER ACTIONS WHEN READY:
- Supabase: upgrade the Restore-Test/launch organization when final Auth hardening is ready, then enable/re-verify leaked-password protection and complete the remaining hosted Auth settings review.
- Vercel: resolve the current deployment-rate-limit/plan capacity blocker before a new Preview-based Browser Gate cycle; no code change is required to "fix" a platform quota.
- These are external platform/account actions. Do not change Production as part of this step.

PRIORITY:
- Supabase Auth hardening is a launch-readiness item, not a customer-facing feature build.
- Vercel capacity is an execution/evidence prerequisite because it can block new Preview deployments and therefore block Browser evidence.

### Continuation Security Heuristic Closure — 2026-09-28

CLASSIFICATION: TARGETED HEURISTIC REVIEW CLOSED FOR CURRENT QUEUE; NO FURTHER BLANKET REVOCATION JUSTIFIED

OBSERVED FACT:
- The prior heuristic queue of authenticated-executable SECURITY DEFINER functions with no obvious `auth.uid` / staff-role token has been narrowed after current Restore-Test inspection.
- The four write-capable-looking wrappers (`velora_create_order_with_commercials`, `velora_create_order_with_coupon`, and the public payment-attempt overloads) delegate into canonical functions that enforce authentication/ownership or purpose guards. `velora_create_order` checks `auth.uid()`; the six-argument payment-attempt implementation checks `auth.uid()`, purpose, order ownership, subscription ownership, and idempotency.
- `velora_get_beauty_context()` delegates to `private.velora_beauty_context()`, whose implementation explicitly checks `auth.uid()` and raises `AUTH_REQUIRED` before reading/writing the user-scoped beauty context snapshot.
- `velora_assert_checkout_currency`, operational checkout-currency/payment-method lookups, and the marketplace/public read functions are read-oriented contracts by design.
- `velora_get_required_legal_documents`, active promotions, active seller ads, FX, localization catalogs/content, and marketplace catalog are intentionally public-style read surfaces with existing anon grants where applicable.
- `velora_get_commission_rate(uuid)` has been separately scoped to internal execution and is no longer client-executable.

INFERRED:
- The "no obvious auth guard" heuristic does not currently identify an unmitigated privileged writer in the reviewed set.
- The appropriate remaining security work is contract-specific Advisor review, not blanket revocation.

REMAINING SECURITY QUEUE:
- six no-policy table contracts (intent/exposure review remains)
- pg_net placement warning review (live dependency documented; no relocation yet)
- final high-impact audit coverage where not already proven
- final hosted Auth configuration

### Continuation Financial Reconciliation Snapshot — 2026-09-28

CLASSIFICATION: CURRENT DATA-QUALITY DRILL COMPLETED; NO LIVE FINANCIAL MISMATCH PROVEN

OBSERVED FACT:
- Current Restore-Test snapshot counts are: orders=16, order_items=20, payment_attempts=61, payments=14, commissions=18, ledger_entries=6, payouts=0, seller_payout_items=0.
- A reconciliation query initially identified 1 captured payment attempt without a corresponding paid payment row and 2 paid orders without captured payment attempts.
- The 2 paid orders without captured attempts are known test fixtures:
  - Order #71 has customer note indicating fixture `shipping-browser-gate`.
  - Order #100001 has customer note `BROWSER_E2E_PRECONDITION` and checkout reference `VELORA-PAYMOB-E2E-100001`.
- The captured-attempt / missing-paid-payment-row case is Order #75, whose note and checkout reference identify it as the historical `PAYMOB_SANDBOX_EVIDENCE_FIXTURE` from Run 36473635960. Its payment row remains the old `velora_test_mode/test/pending` fixture while the canonical Paymob payment attempt captured and the order moved to paid. This is the previously documented fixture mismatch, not a newly discovered live checkout defect.
- A separate current query found zero captured attempts whose parent order is not paid, zero commissions without an order item, and zero orphan ledger lines.
- No data repair was performed. The fixture records were not silently mutated or deleted.

INFERRED:
- The current Restore-Test financial data does not provide evidence of a new live payment/order integrity defect.
- The remaining reconciliation work is cross-system behavior and exception testing, not cleanup of historical QA fixtures.

ACTION FLOW:
Payment/order event -> canonical state check -> correlate attempt/order/payment row -> validate commission linkage -> validate ledger linkage -> classify fixture vs live anomaly -> do not mutate known fixtures -> escalate only for a genuine live mismatch.


### Continuation Seller Dashboard Re-entry RCA + Route-State Hardening — 2026-09-29

CLASSIFICATION: SOURCE CONTRACT GAP CLOSED; BROWSER GATE BLOCKED / NOT EVIDENCED

OBSERVED FACT:
- Current branch before this change was verified at `f660cee80df9d261904a48f0231393e4d95c4a3a`; the stale HEAD value near the top of this Master remains historical metadata and is not current truth.
- Current source inspection showed the earlier hypothesis "63-platform-router captured the wrong Seller opener" is invalidated. `src/scripts/12-localization.js` defines the canonical async Seller opener and `src/scripts/63-platform-router.js` loads later and captures that canonical opener.
- A distinct route-state inconsistency was found: canonical Seller UI controls called `window.VELORA_CLOSE_SELLER`, while `63-platform-router.js` independently defined the route-aware `window.closeSellerPlatform`. The canonical close path did not update the URL route, did not set the platform hidden/aria-hidden state, and could therefore leave `#seller` in the address state while the Seller shell was visually closed.
- `63-platform-router.js` also initialized `returnHash` from the raw current hash. A direct load at `#seller` could therefore treat `seller` itself as the return target instead of a marketplace route.
- No DB schema change was required for this gap.

IMPLEMENTED:
- Commit `b3ad57a60e9b468882e01c60a2f7f263d63653af`: unified `window.VELORA_CLOSE_SELLER` with the router's route-aware `window.closeSellerPlatform` path.
- Commit `4ae5764175f0182d8cc57b418c8184ccf4fc6a6e`: initialized the router return target from `currentMarketplaceHash()` so direct platform-route loads return to a marketplace route rather than the platform route itself.
- No second router, second Seller engine, MutationObserver, arbitrary listener, or schema field was introduced.

VERIFICATION:
- The updated `src/scripts/63-platform-router.js` successfully compiled through a JavaScript Function parser harness.
- A deterministic harness using mocked browser primitives verified:
  - `window.VELORA_CLOSE_SELLER === window.closeSellerPlatform`
  - the unified close path invokes the route-aware close logic
  - marketplace navigation resolves to `home` for a direct `#seller` starting state
- Latest Vercel Preview deployment created from the first fix commit is READY:
  deployment `dpl_D16yQsg78vAKzEvPUwbvmEUcKaKK`
  commit `b3ad57a60e9b468882e01c60a2f7f263d63653af`.
- The second source-only router commit is not yet represented by a separately verified Browser result; Preview/Brower parity must be rechecked against the final post-change commit before any Browser PASS is claimed.

BROWSER GATE STATUS:
- A real Seller browser Gate remains required.
- The available live browser automation run could not start because the TinyFish wallet balance was `-$0.072`. This is a tooling/account-capacity blocker, not an application PASS or FAIL.
- A dedicated authenticated Seller browser credential/session is also required; the customer E2E account must not be converted into a Seller account or otherwise spoofed for proof.
- Therefore this item is NOT fully CLOSED at L7. It is closed at the source/route-contract level and remains OPEN/BLOCKED for Browser evidence.

RESEARCH / PRIOR ART:
- MDN documents that hashchange is driven by URL fragment changes and that History API operations manage SPA session history; `pushState()` adds a history entry while `replaceState()` updates the current entry. The relevant design principle is to keep application route state and browser history coherent instead of maintaining two conflicting close paths.
- WAI-ARIA dialog guidance also treats a modal shell as a distinct UI state with an explicit close operation; this supports making the visible Seller shell's close behavior explicit and deterministic.

ACTION FLOW:
Seller entry event
-> authenticated Seller guard
-> canonical Seller opener
-> Seller route `#seller`
-> visible Seller shell
-> close event
-> SAME route-aware close contract
-> marketplace return route
-> Seller shell hidden/closed
-> re-entry through existing platform switcher or Seller entry
-> canonical Seller opener
-> verify dashboard visibility
-> if auth/session is genuinely missing, recover through normal auth; otherwise no manual intervention.

REMAINING EVIDENCE / NEXT STEP:
- Run the dedicated Seller Browser Gate on a Preview containing the final router commit.
- Capture first open, close, platform-switcher re-entry, existing entry re-entry, and Back/Forward without refresh.
- Record URL/hash, auth/session continuity, Seller shell visibility, dashboard content, and material console/runtime errors.
- Do not close the full Seller Dashboard work item until that Browser evidence exists or is explicitly classified BLOCKED.

CARRY-FORWARD:
- All prior open/blocked/pending/not-evidenced items remain unchanged.
- Next ordered Seller work remains Seller post-approval re-review policy, pending-order/reservation policy, then Seller onboarding Action Flow/audit coverage, unless Browser evidence reveals a new critical Seller routing defect.


### Continuation Seller Product Re-Review Policy + Contract Hardening — 2026-09-29

CLASSIFICATION: SAFEGUARD IMPLEMENTED / BUSINESS POLICY STILL REQUIRES OWNER CONFIRMATION

OBSERVED FACT:
- Current seller edit surface exposes price, stock, name, brand, category, subcategory, image URL, description, tags, and localized product content.
- Prior lifecycle guard required all product status changes to be Staff-only, which would have made an automatic post-approval moderation loop impossible.
- Direct authenticated/anon INSERT/UPDATE/DELETE privileges on `public.products` are currently false, so the Seller RPCs remain the controlled mutation boundary.
- Existing ad visibility already requires an approved product and positive inventory; returning an edited approved product to `pending` therefore naturally suppresses ad visibility while moderation is pending.

RESEARCH / POLICY BASIS:
- Marketplace tooling commonly separates listing/content fields from seller-controlled offer fields. Shopify Marketplace Connect explicitly distinguishes Amazon listing content (images/title/description/identifiers) from seller offer values such as price and inventory; some marketplace channels also review price/relisting changes before activation. citeturn648611search9turn648611search6
- Velora's conservative policy therefore treats:
  - price and stock as operational offer changes that preserve lifecycle status;
  - name, brand, category, subcategory, description, image, tags, emoji, and translations as material listing/content changes that require re-review when the current status is approved or rejected.
  - pending remains pending;
  - inactive remains inactive;
  - rejected + material corrective edit becomes pending so Staff can review the corrected submission.

IMPLEMENTED:
- `velora_seller_update_product` now detects material simple-field changes and requests `pending` re-review for approved/rejected products.
- `velora_seller_update_product_full` now detects material content changes and requests `pending` re-review for approved/rejected products while price/stock-only edits preserve lifecycle.
- `velora_upsert_product_translation` now requests re-review for seller translation changes on approved/rejected products; Staff translation edits do not demote the product.
- `private.velora_guard_product_mutation` now permits exactly one seller-driven lifecycle transition: owned approved/rejected product -> pending. All other seller-driven status changes remain blocked by `STATUS_CHANGE_REQUIRES_STAFF`.
- No new table, column, duplicate moderation engine, or second status model was introduced.

COMMITS:
- `b3e74453cb2c0c1dc98ce420af437887f9163c7c` — seller material-edit re-review RPCs.
- `6a531126e5bb1cef83b61e984db8a53fd79fe124` — allow the narrowly scoped seller -> pending transition.
- `268580a5cb9793702bd7c9f10baadc797117adc9` — corrective translation locking implementation.

RESTORE-TEST VERIFICATION:
- Price-only edit: status remained `approved` with the updated price.
- Simple material edit (brand): status became `pending`.
- Full material edit (name/tags/image): status became `pending`.
- Seller translation edit: status became `pending`.
- All mutation probes were wrapped in transactions and rolled back; the QA product returned to its original state.
- A first translation implementation failed safely before any write because PostgreSQL disallowed `FOR UPDATE` on the nullable side of a LEFT JOIN; this was corrected before the successful test.
- Direct table privileges remain denied to both `anon` and `authenticated`.

INFERRED:
- The engineering safeguard now closes the source/DB contract gap: a Seller cannot materially change an approved/rejected listing and keep it commercially approved through the canonical Seller mutation paths.
- The rule is intentionally conservative and should be treated as the working policy pending explicit owner/business confirmation; no automatic promotion back to approved is ever performed by the seller.

ACTION FLOW:
Seller edit event
-> authenticate + ownership guard
-> classify material vs offer-only change
-> perform canonical update
-> material edit on approved/rejected => pending
-> approved-only catalog/ad eligibility automatically stops
-> audit review-required event
-> Staff reviews -> approve/reject
-> seller notified through existing notification/status architecture
-> no human intervention on ordinary price/stock changes.

NEXT:
Proceed to pending-order abandonment/reservation review. Do not invent an expiry duration until the existing payment/order/provider contracts and current prior art are reconciled and a defensible default is established or the item is explicitly left policy-blocked.


### Continuation Pending Marketplace Orders / Paymob Expiration — 2026-09-29

CLASSIFICATION: PAYMOB CARD EXPIRY PATH HARDENED / COD ABANDONMENT POLICY REMAINS OPEN

OBSERVED FACT:
- Canonical velora_create_order creates marketplace orders in pending, decrements inventory immediately, and creates a pending payment row.
- public.orders has no expires_at; public.payment_attempts has no local expiry column.
- COD orders intentionally remain pending after checkout and are handled by the seller order workflow, so a generic pending-order TTL would risk cancelling valid COD orders.
- The current Paymob checkout Edge Function sends expiration:3600 seconds to Paymob's Intention API. Paymob documents expiration as the number of seconds before the payment intention expires and its payment link becomes invalid; its current documentation gives 3600 as a one-hour example. Transaction Inquiry is the documented programmatic reconciliation path. citeturn938046search0turn938046search1turn924615search4
- The existing Paymob reconciliation worker claims stale pending/requires_action/authorized marketplace attempts after 70 minutes and retries with a bounded lease/backoff. Before this hardening, an attempt could reach exhausted + last_outcome=pending while the attempt/order/inventory remained pending.
- Current Restore-Test inspection found 19 current Paymob reconciliation states in exhausted + last_outcome=pending; they are historical QA fixtures and were not silently mutated.
- Current reconciliation also has a separate ambiguous/error path. Those states remain manual/escalation findings and are not automatically cancelled.

IMPLEMENTED:
- Migration 20260929012000_expire_exhausted_paymob_attempts.sql, corrected in commit 26d871eec2ffaf8e60b36a7bc32235940cce00d7.
- The existing private.velora_record_paymob_reconciliation_result now, after 3 bounded pending inquiries and once the Paymob marketplace attempt is at least 60 minutes old, marks eligible Paymob marketplace attempts failed with PAYMOB_INTENTION_EXPIRED.
- The implementation first locks the canonical payment attempt and never overrides a terminal state that a webhook may have established concurrently.
- The existing trg_velora_release_inventory_after_failed_payment remains the sole inventory/order/payment compensation path; no second release engine was introduced.
- Existing reconciliation state becomes completed after expiration. Ambiguous/error outcomes still exhaust into the existing high-severity reconciliation finding rather than being guessed as expired.
- Only attempts explicitly carrying metadata.paymob_reconciliation_eligible=true are subject to the automated expiration rule.

RESTORE-TEST VERIFICATION:
- Transactional simulation with an exhausted pending Paymob attempt produced payment_attempt.status pending -> failed, failure_code PAYMOB_INTENTION_EXPIRED, order.status pending -> cancelled, order.payment_status pending -> failed, and reconciliation state completed with last_outcome failed.
- The same transaction proved downstream side effects: product stock 15 -> 16, pending commission -> reversed, and payment_failed_inventory_released audit event created.
- The probe was rolled back; the existing QA fixture was left unchanged.
- A first implementation error was caught before application, corrected in Git, and the corrected migration then applied successfully.

POLICY RESULT:
- Paymob card/payment-intention abandonment now has a defensible provider-derived expiry boundary and automatic recovery.
- Generic COD/pending-order abandonment remains OPEN because no equivalent provider expiry exists and an arbitrary TTL would be a business-policy decision.
- Do not add a second generic order-expiry scheduler. The existing Paymob reconciliation cron is the automation boundary for Paymob.
- Future generic COD abandonment requires an explicit operations policy covering how long a COD order may stay pending, whether inventory remains committed, and what seller/customer notifications occur before cancellation.

ACTION FLOW:
Paymob checkout intention created (1h provider expiry)
-> local payment attempt pending
-> reconciliation eligibility
-> stale after 70m
-> transaction inquiry
-> bounded retry/backoff
-> terminal provider result OR 3rd pending inquiry after provider expiry window
-> local Paymob attempt failed with explicit expiry reason
-> existing failed-payment trigger releases stock/reverses pending commissions/cancels order
-> audit
-> customer/seller notification through existing lifecycle
-> ambiguous provider state => reconciliation finding + human escalation.

CARRY-FORWARD:
- Generic COD abandonment/reservation policy remains open.
- Existing Paymob live/provider/Browser gates remain separate; this source/DB automation proof does not establish live settlement or Browser PASS.


### Continuation Returns Resolver Client-Boundary Review — 2026-09-29

CLASSIFICATION: CLIENT CONTRACT CLOSED / LEGACY COMPATIBILITY CONTRACT RETAINED

OBSERVED FACT:
- Restore-Test currently exposes two overloaded public velora_resolve_return signatures.
- The legacy 3-argument signature is ACL-restricted to postgres/service_role; anonymous and authenticated EXECUTE are false.
- The transition-aware 6-argument signature is the only authenticated client-executable resolver, and it requires Staff authority inside the function.
- The canonical Trust & Compliance UI in src/scripts/70-s1-d-trust-operations.js calls only the 6-argument form and supplies refund reference/provider/method when status=refunded.
- Therefore the stale 3-argument signature cannot be invoked through the current anonymous/authenticated client roles and does not create a client-side parallel return-resolution path.
- No ACL change is required.

INFERRED:
- The documented "legacy resolver mismatch" is no longer a client execution vulnerability. It remains a compatibility/dead-contract cleanup item only.
- Do not delete or alter the legacy signature merely for historical hygiene; preserve it until all internal/service callers are proven absent and its deprecation policy is explicitly decided.

ACTION FLOW:
Return enters Trust/Compliance queue
-> Staff authorization
-> transition-aware resolver
-> validated state transition
-> refund evidence required for refunded
-> canonical audit
-> downstream refund/accounting work remains separate.

CARRY-FORWARD:
- Return-window policy
- partial-return discount allocation
- shipping/tax refund policy
- restocking policy
- provider refund execution
- customer-facing return UX
- legacy 3-argument resolver retirement decision
remain OPEN.


### Continuation Security Advisor — RLS Enabled / No Policy Findings — 2026-09-29

CLASSIFICATION: CLOSED-DONE FOR DIRECT CLIENT EXPOSURE / ADVISOR LINT RETAINED ONLY IF HOSTED SCANNER STILL REPORTS IT

OBSERVED FACT:
- The current Restore-Test public-schema scan finds four RLS-enabled tables with zero policies:
  billing_instruments
  paymob_card_tokenization_sessions
  regional_pricing
  seller_subscription_renewal_jobs
- Both anon and authenticated have no SELECT/INSERT/UPDATE/DELETE privilege on all four public tables.
- The two Advisor-listed private tables, private.beauty_catalog_revision and private.beauty_recommendation_rate_events, have no anon schema USAGE, no anon table DML, and no authenticated table SELECT/INSERT privilege. Authenticated has private-schema USAGE but direct table privileges remain denied.
- Therefore the six historical Advisor no-policy findings do not establish direct client Data API exposure in the current Restore-Test grant model.
- No blanket RLS policies, table grants, or revocations were added.

INFERRED:
- These findings are intentional internal/service-only contracts rather than proven customer-facing exposures.
- Removing the warning by adding blanket policies would weaken the least-privilege model and is not justified by evidence.

ACTION FLOW:
Advisor finding
-> identify table
-> inspect schema exposure + direct grants + RLS
-> classify internal-only vs client-facing
-> retain current deny boundary
-> no synthetic policy added
-> periodically re-check if a new caller or grant appears.

CARRY-FORWARD:
- pg_net placement warning remains open because it is a live cron dependency.
- hosted Auth leaked-password protection remains owner/platform configuration work.
- final targeted Advisor coverage remains part of launch hardening.


### Continuation Anonymous SECURITY DEFINER Review — 2026-09-29

CLASSIFICATION: CLOSED-DONE FOR CURRENT ANON SECURITY-DEFINER QUEUE

OBSERVED FACT:
- Current Restore-Test query of all public SECURITY DEFINER functions with anon EXECUTE returns seven functions:
  velora_get_active_seller_ads
  velora_get_fx_rate
  velora_get_i18n_catalog
  velora_get_localized_content
  velora_get_marketplace_catalog
  velora_get_required_legal_documents
  velora_list_active_promotions
- All seven are read-oriented public marketplace/configuration surfaces; no seller/order/payment/gift-card/payout/legal-write operation appears in this anon SECURITY DEFINER set.
- velora_account_action was separately observed with anon EXECUTE in its ACL, but it is not SECURITY DEFINER; its staff guard therefore does not create a privileged SECURITY DEFINER anonymous execution path.
- No blanket anonymous revocation was made.

INFERRED:
- The current anon SECURITY DEFINER warning set is aligned with intentional public read surfaces, subject to continued function-specific review.
- The previous heuristic concern about anonymous privileged writers is closed for the currently inspected set.

ACTION FLOW:
Advisor warning -> enumerate anon SECURITY DEFINER -> inspect function direction/guards -> classify public read vs privileged write -> retain intentional reads -> deny/escalate only if a privileged writer appears.


### Continuation Seller Product Re-Review Notification — 2026-09-29

CLASSIFICATION: ACTION FLOW CLOSED-DONE AT SOURCE/DB / BROWSER EVIDENCE DEFERRED TO AGGREGATE GATE

OBSERVED FACT:
- The existing product status notification trigger only handled approved, rejected, inactive, and reactivated states.
- Seller-requested material edits now legitimately move approved/rejected products to pending, so the notification path had to cover that transition.
- No second notification mechanism was needed.

IMPLEMENTED:
- Migration 20260929015000_product_rereview_notification.sql, commit 5d9389108e1b2057a1c14d40cd4fdd4c1514ddda.
- Existing private.velora_notify_product_status() now emits product_re_review_required when a seller-owned product moves approved/rejected -> pending.
- Existing private.velora_create_notification() remains the notification writer; existing push dispatch/lifecycle infrastructure remains the downstream delivery mechanism.

RESTORE-TEST VERIFICATION:
- Using the real seller canonical RPC velora_seller_update_product with Seller auth context, a material brand edit produced pending state and a product_re_review_required notification addressed to the same seller.
- The entire probe was transactional and rolled back, leaving the QA product/data unchanged.
- A first verification query contained an invalid FROM alias; it failed before any persistent write. The corrected verification passed.

ACTION FLOW:
Seller material edit
-> authenticated ownership validation
-> product becomes pending
-> existing product status trigger
-> product_re_review_required notification
-> existing notification/push lifecycle
-> Staff moderation
-> approved/rejected decision
-> standard product status notification.

CARRY-FORWARD:
- No Browser Gate yet; aggregate Browser Gate will verify the complete Seller flow later.


### Continuation Seller Profile / Store Projection Synchronization — 2026-09-29

CLASSIFICATION: CLOSED-DONE AT SOURCE/DB; AGGREGATE BROWSER GATE DEFERRED

OBSERVED FACT:
- The approved Seller test account had different profile/store projections before the fix: sellers.store_name/store_slug differed from stores.name/slug.
- Canonical Seller Settings used velora_update_seller_profile, while canonical Seller Dashboard reads the store projection for country/currency and seller profile fields.
- The existing RPC updated only public.sellers, creating a real source/projection drift path.
- stores has a unique slug constraint and there is at most one current store row per owner in Restore-Test.

IMPLEMENTED:
- Migration 20260929024000_sync_seller_profile_store_projection.sql, commit b904c2105e8f60d6d723e69433601dccc672b19c.
- Existing velora_update_seller_profile now locks and updates the owned seller plus its owned store projection in one transaction.
- Name, slug, description, and logo_url are synchronized; country/currency/language/status remain governed by the store contract and are not overwritten from seller profile fields.
- Any unique/conflict failure rolls back the entire transaction; no partial seller/store drift is left behind.
- Commit 04b44cba3fad3a945e7f9845baa1a545c9b430f6 refreshes window.VELORA_CANONICAL_STORE after a successful profile save so the current session does not retain a stale store projection in memory.
- No schema change, duplicate profile engine, or second source of truth was introduced.

RESTORE-TEST VERIFICATION:
- Transactional Seller RPC update showed sellers and stores carrying the same new name/slug/description/logo_url while preserving EG/EGP/approved store state.
- Transaction was rolled back; no QA fixture mutation persisted.

ACTION FLOW:
Seller edits Store Profile
-> authenticate + seller ownership
-> lock seller + store projection
-> update both atomically
-> audit seller_profile_updated with store_projection_synced=true
-> refresh canonical Seller + Store session state
-> subsequent Seller Dashboard reads remain coherent.

### Continuation Seller Suspension / Store / Catalog Boundary — 2026-09-29

CLASSIFICATION: CLOSED-DONE AT SOURCE/DB CONTRACT

OBSERVED FACT:
- velora_set_seller_status is Staff-only.
- It synchronizes seller status and store status: approved -> approved, suspended -> suspended, rejected -> rejected, pending -> pending.
- velora_marketplace_catalog filters for product.status=approved AND store.status=approved.
- Therefore Seller suspension cannot leave the Store projection approved through the canonical status mutation path, and suspended stores are excluded from the public marketplace catalog.
- The status operation is audited and uses the existing notification trigger; no parallel suspension engine was created.

VERIFICATION:
- Transactional suspension/restore probe exercised the canonical RPC and transaction rollback; final seller/store state returned to approved/approved.
- Public catalog definition independently confirmed the approved-product + approved-store guard.
- Browser evidence remains deferred to the aggregate gate.

### Continuation Privileged Authorization Negative Paths — 2026-09-29

CLASSIFICATION: CLOSED-DONE AT L1-L4

OBSERVED FACT:
- Customer execution of gift-card issuance, seller status mutation, product status mutation, payout execution, platform promotion creation, and account action all fail at their Staff/Owner authorization guards before privileged work.
- Admin execution of Owner-only gift-card issuance fails with OWNER_ONLY.
- Owner execution of gift-card issuance succeeded inside a transaction and was rolled back.
- Legal publication: Customer and Admin both fail with LEGAL_OWNER_APPROVAL_REQUIRED; Owner passes the Owner guard and then correctly fails with LEGAL_DOCUMENT_REQUIRED when no document id is supplied.
- Admin attempting to upsert a legal document directly into approved status fails with LEGAL_OWNER_APPROVAL_REQUIRED; Customer fails with STAFF_ONLY.
- velora_account_action anonymous EXECUTE was removed; current ACL is postgres + authenticated + service_role, with anon=false. This was the smallest justified hardening because the function is a privileged write surface and has no anonymous caller.

ACTION FLOW:
Identity
-> role resolution
-> server-side authorization guard
-> input/state validation
-> canonical writer
-> side effects
-> audit
-> notification/recovery where supported.

### Continuation Financial Reconciliation Drill — 2026-09-29

CLASSIFICATION: NO NEW LIVE FINANCIAL MISMATCH PROVEN

OBSERVED FACT:
- Current Restore-Test reconciliation snapshot: paid_orders=5, captured_marketplace_attempts=3, paid_payment_rows=2, commissions=18, ledger_entries=6, payouts=0, payout_items=0.
- There are 2 paid orders without captured marketplace attempts: Order 71 is the known shipping-browser-gate fixture; Order 100001 is the known BROWSER_E2E_PRECONDITION fixture.
- There is 1 captured marketplace attempt without a paid payment row: Order 75, explicitly marked PAYMOB_SANDBOX_EVIDENCE_FIXTURE with provider payment id 543773877 and checkout reference paymob-evidence-36473635960-525448fa-ab19-4730-8f33-68922eac2f8c.
- Current queries also prove 0 captured attempts whose parent order is not paid, 0 orphan commissions, and 0 orphan order-linked ledger lines.
- No financial data repair was performed; known QA fixtures remain intact.

INFERRED:
- The current financial mismatch report is fixture/data-provenance noise rather than a newly proven live checkout defect.

### Continuation Vercel Delivery Capacity — 2026-09-29

CLASSIFICATION: BLOCKED BY EXTERNAL PLATFORM CAPACITY

OBSERVED FACT:
- Latest READY Preview is deployment dpl_2vtMbEQJYS7mcibPqRMBtfW8sqFG from commit b1e5f5c0861fc2ee34daea3b9a2446f33269e34f.
- Current commits after that point (including the Seller notification, profile/store synchronization, and security hardening changes) report Vercel combined status failure with target https://vercel.com/ahmedconccc-7063?upgradeToPro=build-rate-limit.
- Therefore final source/DB changes currently do not have a verified latest Preview deployment.
- No Production deployment was attempted and Production remains frozen.

NEXT:
- Once the Vercel capacity blocker is resolved, allow/create the normal Preview deployment for the current branch head and run the aggregate Browser Gate against that exact commit.


### Continuation Seller/Store Projection + Re-Review Action Flow Verification — 2026-09-29

CLASSIFICATION: CLOSED-DONE AT SOURCE/DB/ACTION-FLOW CONTRACT; BROWSER DEFERRED

OBSERVED FACT:
- velora_update_seller_profile now updates the seller record and the owned store projection atomically.
- Seller status governance already synchronizes sellers.status and stores.status.
- Product material-edit re-review now emits the existing notification type product_re_review_required.
- The existing product status notification trigger continues to emit product_approved/product_rejected/product_reactivated/product_inactive events for governed Staff changes.
- The complete Seller -> Staff product flow was exercised in one Restore-Test transaction:
  Seller material edit -> product pending -> re-review notification for the Seller -> Staff approval -> product approved -> product approval notification.
- The complete transaction was rolled back; no QA state was persisted.

SECURITY:
- Anonymous EXECUTE was removed from velora_account_action, velora_record_fraud_event, and velora_review_seller_application where no legitimate anonymous caller exists.
- velora_record_search_event remains anonymous-executable as intentional public telemetry.

AUDITABILITY:
- High-impact canonical writers inspected in the current queue have explicit audit coverage. Missing audit_logs in trigger/helper wrappers does not represent a gap where the invoking canonical writer already records the state change, and webhook recording has its own durable provider_webhook_events record.


### Continuation Customer Orders + Return Request UX — 2026-09-29

CLASSIFICATION: CLOSED-DONE AT SOURCE/DB/ACTION-FLOW / BROWSER DEFERRED TO AGGREGATE GATE

OBSERVED FACT:
- The legacy customer Orders renderer in src/scripts/00-localization.js reads localStorage('maha_orders').
- No later script before this change replaced that renderer; canonical checkout creates orders in Supabase and then routes the customer to the Orders page.
- Therefore canonical checkout orders could exist server-side without appearing in the customer's Orders UI. This was a real cross-system UI/data-source gap.
- Existing velora_request_return(uuid,uuid,jsonb,text,text) already provides the canonical customer return contract. It validates customer ownership, delivered order/payment settlement, store ownership, delivered shipment item evidence, quantity, duplicate-return prevention, refund calculation, and audit.

IMPLEMENTED:
- src/scripts/71-customer-orders-returns.js, commit 3944721e68f0e602461e96e7adc2c276745de866.
- src/index.html now loads the adapter after all existing scripts, commit 581b71a474e04510bf4cc660c170a614627fefbd.
- The adapter replaces renderOrdersPage with a canonical RLS-backed renderer over orders, order_items, and returns. It does not create a second order engine.
- Order UI groups items by existing store_id and exposes Request Return only for delivered + paid/refunded orders and only when an active return for that store is not already present.
- Return request UI calls the existing velora_request_return RPC for one store at a time, matching its store-scoped backend contract.
- No new table, column, RPC, order engine, return engine, or data model was introduced.

VERIFICATION:
- Adapter source compiles through a JavaScript parser harness.
- Restore-Test returned delivered QA Order #100001 with one canonical order item; it initially had no shipment evidence, so the return RPC correctly rejected with ITEM_NOT_DELIVERED.
- A temporary delivered shipment + shipment_item fixture was created inside one transaction. The real velora_request_return RPC then returned status=requested, refund_amount=250.0000 EGP, and created the return_requested audit event. The full transaction was rolled back.
- No QA shipment, return, or customer state persisted.
- Customer Orders browser evidence remains deferred to the final aggregate Browser Gate.

ACTION FLOW:
Checkout/order created
-> customer navigates Orders
-> canonical Supabase orders + item/return state loaded
-> store-scoped return eligibility derived
-> customer selects quantities/reason
-> canonical return RPC validates delivery/payment/ownership/quantity
-> return requested + audit
-> Staff Trust/Compliance resolution
-> refund evidence or rejection
-> existing notification/action infrastructure.

### Continuation Performance Advisor Classification — 2026-09-29

CLASSIFICATION: OPTIMIZATION QUEUE / NOT A CURRENT CORRECTNESS BLOCKER

OBSERVED FACT:
- Current Restore-Test Performance Advisor reports 93 unindexed foreign keys and 45 multiple-permissive-policy findings, plus unused-index information.
- The findings span long-established commerce/RLS tables and include intentional policy combinations such as customer + staff read access.
- No current performance finding was shown to establish a correctness, data-integrity, or authorization failure.

DECISION:
- Do not mass-add foreign-key indexes or collapse RLS policies merely to reduce Advisor counts. Each index/policy change must be justified by actual query workload and verified after mutation.
- Preserve the existing explicit rule against historical policy/index hygiene over-refactoring.
- Treat this queue as post-correctness performance optimization, below current payment/provider, legal, production, rollback, and aggregate Browser gates.


### Continuation Customer Cancellation + Seller Payout Request UI — 2026-09-29

CLASSIFICATION: CLOSED-DONE AT SOURCE/DB CONTRACT / PROVIDER SETTLEMENT AND BROWSER EVIDENCE REMAIN OPEN

OBSERVED FACT:
- Canonical velora_cancel_order(uuid) already existed and was authenticated-owner scoped. It permits cancellation only for customer-owned pending/confirmed orders whose payment is still pending, restores item/variant stock, reverses pending commissions, cancels the order/payment state, and writes order_cancelled audit evidence.
- No canonical customer UI caller for that RPC was present before this continuation.
- The new canonical customer Orders adapter now exposes Cancel order only when the server contract says the local state is cancellable.
- Transactional cancellation verification on Order #74 showed cancelled/cancelled state, stock restoration, pending commission reversal, and order_cancelled audit evidence; transaction rolled back.

IMPLEMENTED:
- src/scripts/71-customer-orders-returns.js now exposes customer order cancellation through the existing velora_cancel_order RPC.
- No cancellation engine or new schema was introduced.

PAYOUT UI:
- The existing velora_request_seller_payout(currency) contract performs the full server-side eligibility calculation: finalized commission, paid+delivered order, shipment delivered at least 7 days ago, not already included in payout, then creates a pending payout and itemized payout rows with audit evidence.
- The existing velora_record_payout_execution remains Staff-only and records external execution plus a payout ledger line; therefore the frontend must not calculate or simulate settlement.
- Added src/scripts/72-seller-payouts.js with a request-only Seller Center adapter and payout history using existing RLS.
- Loaded after the existing Seller Center scripts in src/index.html.
- The UI never reproduces the eligibility formula; it delegates to the canonical request RPC and only reports NO_PAYOUT_ELIGIBLE_BALANCE when the server rejects the request.
- Current Seller payout negative test correctly returned NO_PAYOUT_ELIGIBLE_BALANCE for the existing Seller fixture; no payout was created.
- Adapter source compiles and script is loaded after the Seller canonical shell.
- External payout/provider settlement remains NOT EVIDENCED.

CURRENT BRANCH HEAD:
- Current observed continuation branch HEAD is 41689462a807dba7798dda10f56101bc1a25c231 at the time of this ledger update.
- This HEAD is not yet represented by a verified latest Vercel Preview because the current Vercel build-rate-limit blocker affects newer commits.

ACTION FLOW:
Customer cancellation:
Customer opens Orders -> canonical order state -> cancellable guard -> existing velora_cancel_order -> stock/commission/payment/order compensation -> audit -> Orders refresh.

Seller payout:
Seller opens Payouts -> request canonical payout -> server eligibility -> pending payout + itemized rows + audit -> Staff/provider execution -> ledger + audit -> external settlement remains outside frontend authority.



### Continuation Subscription State Auditability — 2026-09-29

CLASSIFICATION: CLOSED-DONE AT SOURCE/DB CONTRACT / RUNTIME EVIDENCE DEFERRED

OBSERVED FACT:
- seller_subscriptions has no trigger-based audit history.
- velora_sync_subscription_state is the canonical state reconciliation function for pending, active, past_due, cancelled, and expired states.
- The function already owns all state transitions and renewal/expiry side effects, making it the correct place for a single audit event rather than adding a second trigger or audit engine.

IMPLEMENTED:
- Migration 20260929041000_audit_subscription_state_transitions.sql.
- velora_sync_subscription_state now records seller_subscription_state_changed only when status, payment_status, payment_id, started_at, or expires_at actually changes.
- Idempotent/no-op syncs do not create duplicate audit events.
- Renewal-job cancellation and expiry notification cleanup remain on the same canonical function.

VERIFICATION:
- Migration applied successfully to Restore-Test.
- Restore-Test currently has zero seller_subscriptions and zero renewal jobs, so no persistent runtime fixture was mutated for proof. The source/DB contract was verified directly; provider/legal subscription runtime proof remains deferred until valid test fixtures exist.

NEXT:
- Subscription cancel/upgrade/downgrade/replacement, proration, entitlement matrix, and provider settlement remain policy/provider-bound and are not to be guessed.


### Continuation Shipping Creation Auditability — 2026-09-29

CLASSIFICATION: CLOSED-DONE AT SOURCE/DB/ACTION-FLOW

OBSERVED FACT:
- velora_create_shipment is the canonical Seller/Staff shipment-creation contract and had no direct audit record before this continuation.
- Existing velora_update_shipment_status already validates allowed shipment transitions and records shipment_status_updated.
- Existing velora_submit_delivery_proof already records delivery_proof_submitted and moves eligible shipments to delivered.
- Shipment lifecycle therefore already had audit coverage for status/proof, with only creation missing.

IMPLEMENTED:
- Migration 20260929043000_audit_shipment_creation.sql, commit 10d2974fb8ca5218857dc1ec053f0db6c17958ab.
- velora_create_shipment now records shipment_created with order/store/item-count/carrier/service/tracking metadata after shipment + shipment_items are inserted.

RESTORE-TEST VERIFICATION:
- Seller transactional shipment creation on paid Order #76 produced an in_transit shipment and shipment_created audit evidence.
- Transaction was rolled back; no shipment persisted.

NO FURTHER SHIPPING ENGINE:
- No duplicate shipment lifecycle, scheduler, carrier integration, or notification system was introduced.


### Continuation Auditability Coverage Drill — 2026-09-29

CLASSIFICATION: CLOSED-DONE AT CURRENT SOURCE/DB CONTRACT

OBSERVED FACT:
- High-impact marketplace events reviewed in the current Restore-Test contract now have one durable evidence path:
  - seller application submission/review -> audit_logs
  - product material edit/re-review/status -> audit_logs + existing notifications
  - store/seller profile mutation -> audit_logs
  - seller suspension/status -> governed RPC + existing audit/notification path
  - order creation/status -> canonical order status history + existing order notifications/financial trigger
  - payment-attempt state changes -> durable payment_attempts + payment automation + provider-session audit where applicable
  - Paymob reconciliation/expiry -> reconciliation state + audit_logs + existing failed-payment compensation
  - shipment creation/status/delivery proof -> audit_logs
  - return request/resolution -> audit_logs
  - seller subscription state -> audit_logs on actual state transition
  - seller ad lifecycle transitions -> audit_logs + existing seller notifications
  - payout request/execution -> payout audit + ledger evidence
  - gift-card issue/redeem -> gift-card transaction ledger + audit
  - promotion/coupon governance -> canonical audit/control paths
  - legal governance -> owner/staff approval/audit path
  - provider webhook -> provider_webhook_events durable record + canonical reconciliation
  - workflow cases -> workflow_events durable event history.

INFERRED:
- The remaining functions that do not insert into audit_logs directly are not automatically audit gaps: some are read/snapshot helpers, low-level service-role primitives, or state changes already recorded by canonical table histories/events.
- Adding blanket audit triggers or duplicate audit rows would increase noise and risk without improving evidence quality.

DECISION:
- Auditability is closed at the architecture/source/DB layer.
- Keep Browser/provider/Production evidence as separate higher evidence levels; audit rows do not promote those gates to PASS.
