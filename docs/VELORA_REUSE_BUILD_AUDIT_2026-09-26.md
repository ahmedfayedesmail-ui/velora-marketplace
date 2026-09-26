# Velora — Reuse / Build Audit
## 2026-09-26 — Restore-Test / audit/full-gate-2026-09-25

**Purpose:** Reduce unnecessary first-principles engineering by reusing proven open-source patterns and integrating commodity services, while protecting Velora's unique product logic.

**Production:** FROZEN.  
**Scope:** Source and Restore-Test audit only. No production mutations.  
**Rule:** Learn/reuse architecture and code only where the source license and attribution requirements permit it. Do not copy proprietary code, private implementations, credentials, assets, or data.

---

## 1. Operating principle

> **Build what makes Velora different. Reuse what is already solved. Integrate what is a commodity.**

Three lanes:

- **BUILD:** Beauty Passport, Routine Discovery/generation, beauty-specific personalization, marketplace-specific trust/UX, Arabic-first beauty journey.
- **REUSE/ADAPT:** order/fulfillment state models, admin patterns, tracking presentation, returns workflow patterns, notification/event patterns, generic commerce primitives.
- **INTEGRATE:** payment gateways, shipping carriers/aggregators, email delivery, push infrastructure, analytics, CDN, tax/invoice providers where required.

No major subsystem should be rewritten merely because an external project has a similar feature.

---

## 2. Current Velora evidence snapshot

### Existing foundations — keep and build around them

- Canonical cart and checkout are already established.
- Routine Discovery and Routine → Cart are already established.
- Canonical shipment model already exists:
  - `shipments`
  - `shipment_items`
  - `shipping_carriers`
  - carrier/service/tracking number/tracking URL
  - shipment status
  - shipped/delivered timestamps
  - estimated delivery timestamp
- Shipment RPCs already exist for creation, operational listing, and controlled status updates.
- Customer order history already loads shipment data and currently renders tracking number, estimated delivery, shipped date, and a safe HTTP(S) tracking link.
- Shipping is backed by a Restore-Test manual carrier/rate fixture.
- Legal infrastructure already exists with versioned legal documents, publish/acceptance RPCs, and fail-closed checkout behavior.
- Payment orchestration already exists and intentionally avoids claiming provider settlement without verified provider evidence.
- Security/audit workflow is already present in GitHub Actions.

### Current Restore-Test counts observed on 2026-09-26

| Area | Count |
|---|---:|
| products | 5 |
| product variants | 1 |
| carts | 2 |
| cart items | 5 |
| orders | 4 |
| order items | 8 |
| shipments | 0 |
| shipment items | 0 |
| shipping carriers | 1 |
| payment providers | 6 |
| payment provider methods | 1 |
| payment attempts | 0 |
| provider webhook events | 0 |
| legal documents | 0 |
| legal acceptances | 0 |
| seller subscriptions | 0 |

**Interpretation:** The database foundation is ahead of its E2E operational evidence. In particular, shipment, payment-settlement, legal-publication, and subscription flows still need real verification.

---

## 3. Feature classification

| Feature | Lane | Current status | Action |
|---|---|---|---|
| Beauty Passport | BUILD | Existing | Protect as Velora IP/product logic |
| Routine Discovery / generation | BUILD | Existing | Protect; do not replace with generic recommender |
| Routine → Cart | BUILD/ADAPT | Existing | Keep canonical adapter |
| Cart | LEAVE ALONE / ADAPT | Existing | Do not rewrite |
| Checkout | LEAVE ALONE / HARDEN | Existing | Continue evidence-led fixes only |
| Order lifecycle | REUSE/ADAPT | Existing | Compare against mature commerce models |
| Fulfillment / shipment | REUSE/ADAPT | Existing | Copy patterns, not proprietary code |
| Tracking UX | REUSE/ADAPT | Existing | Add mature customer-facing conventions |
| Shipping rates/zones | INTEGRATE/ADAPT | Existing | Keep DB contract; connect real providers later |
| Carrier integration | INTEGRATE | Manual provider currently | Add real carrier adapters only when commercial/API access exists |
| Payments | INTEGRATE | Paymob test route | Production settlement requires live provider evidence |
| Returns/refunds | REUSE/ADAPT | Foundation incomplete | Study mature return/claim flows before building |
| Notifications | REUSE/ADAPT | Foundation exists | Event-driven shipment/order notifications |
| Reviews | LEAVE ALONE / ADAPT | Existing | Use established moderation patterns |
| Wishlist | LEAVE ALONE | Existing | No need for external rebuild |
| Seller dashboard | REUSE/ADAPT | Existing | Compare marketplace/admin conventions |
| Admin | REUSE/ADAPT | Existing | Improve only against verified gaps |
| Promotions/coupons | REUSE/ADAPT | Foundation exists | Backend-authoritative rules |
| Gift cards | REUSE/ADAPT | Server foundation exists | Reuse accounting/expiry patterns |
| Seller subscriptions | REUSE/ADAPT | DB foundation exists | Study subscription lifecycle patterns |
| Legal Center | BUILD + COUNSEL | Engineering foundation exists | Legal text and entity facts remain external/legal inputs |
| Privacy/data controls | BUILD + INTEGRATE | Foundation exists | Map against Egyptian PDPL + provider requirements |
| Authentication | INTEGRATE + HARDEN | Supabase Auth | Enable platform security controls; no custom auth rebuild |
| Analytics | INTEGRATE | Partial | Prefer provider/event schema over custom analytics stack |
| SEO assets | ADAPT | Basic site metadata exists | Add robots/sitemap only if launch scope requires |
| Search | REUSE/INTEGRATE | Existing catalog search | Study mature ranking/filter patterns before expansion |
| Image/media | INTEGRATE | Supabase/static | Use object storage/CDN rather than custom media service |
| Tax/invoicing | INTEGRATE | Not final | Determine actual tax model first |

---

## 4. External projects to study

### Medusa
Medusa exposes modular commerce domains and explicit fulfillment workflows. Its documentation separates fulfillment, shipment, shipping options, third-party fulfillment providers, and delivered state. This is directly relevant to Velora's shipment architecture. The core project is MIT-licensed.

Sources:
- https://github.com/medusajs/medusa
- https://docs.medusajs.com/resources/commerce-modules/fulfillment
- https://docs.medusajs.com/user-guide/orders/fulfillments

**Study:** fulfillment-vs-shipment separation, provider abstraction, status transitions, workflow/idempotency patterns.

### Spree Commerce
Spree's open-source core is BSD-3-Clause licensed and explicitly includes marketplace, fulfillment, promotions, gift cards, and returns/exchanges/claims capabilities in its documented commerce primitives.

Source:
- https://github.com/spree/spree

**Study:** marketplace order graph, seller-facing primitives, fulfillment/returns, promotions and gift-card domain boundaries.

### Saleor
Saleor's core repository currently identifies a BSD-3-Clause license, while the current storefront repository has a separate FSL-1.1-ALv2 license with a competing-use restriction and future Apache-2.0 grant. Therefore, license checking must be done per repository/version before any code reuse.

Sources:
- https://github.com/saleor/saleor
- https://github.com/saleor/storefront/blob/main/LICENSE

**Study:** composable order/payment architecture and domain separation. Do not copy storefront code without a current license review.

### Sylius
Sylius is an MIT-licensed open-source commerce framework and documents flexible order, shipping, returns, and plugin-based extension patterns.

Source:
- https://github.com/Sylius/Sylius

**Study:** modular domain boundaries, shipping/fulfillment extension points, return handling, testing discipline.

### Vendure
Vendure provides a plugin-first architecture and marketplace support, but its repository is GPLv3 under the current public licensing terms unless a separate commercial agreement applies.

Source:
- https://github.com/vendurehq/vendure
- https://github.com/vendurehq/vendure/blob/master/license/license-faq.md

**Study:** plugin/module architecture and marketplace abstractions. Treat direct code reuse as license-sensitive; architecture study is safer unless the licensing implications are explicitly accepted.

### WooCommerce Fulfillments
WooCommerce's current public documentation exposes a dedicated Order Fulfillments REST API with fulfillment records, tracking number/provider metadata, and customer/order ownership boundaries. The fulfillment feature was introduced behind a feature flag for testing before being expanded.

Sources:
- https://github.com/woocommerce/woocommerce
- https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/client/admin/docs/features/fulfillments-rest-api.md

**Study:** simple fulfillment object shape, tracking metadata, read/write permissions, and customer notification controls.

---

## 5. Shipping design extracted from the study

The common mature pattern is:

```
Order
  ↓
Fulfillment
  ↓
Shipment
  ↓
Carrier / Fulfillment Provider
  ↓
Tracking reference + URL
  ↓
Status updates
  ↓
Customer tracking timeline
```

The external systems generally do **not** replace the marketplace order. They operate as fulfillment providers around the order.

For Velora this means:

- Keep the current `orders → order_items → shipments → shipment_items` graph.
- Keep seller/store ownership boundaries.
- Keep carrier/service/tracking/ETA fields already present.
- Add provider integrations as adapters later.
- Never invent a fake "Velora Transportation Company" layer.
- Manual fulfillment remains a valid E2E fallback until a real carrier account/API is available.

---

## 6. Customer tracking UX target

The customer order page should eventually present each shipment independently:

**Seller / Shipment**
- Status
- Carrier / service
- Tracking number
- Estimated delivery
- Shipped date
- Delivered date when present
- Track shipment button when a valid provider URL exists
- Clear explanation when tracking has not yet been assigned

For split orders, each seller's shipment remains visually separate.

A mature status progression can be represented as:

```
Preparing → Shipped → In transit → Delivered
                 ↘
             Failed / Returned
```

Velora must display the actual authoritative shipment state, not infer delivery from the existence of a tracking number.

---

## 7. What we will NOT do

- No whole-cart rewrite.
- No custom transportation network.
- No arbitrary new shipment columns while existing fields already cover the requirement.
- No MutationObserver for shipping.
- No random click-listener architecture.
- No proprietary code copying from commercial websites.
- No copying from open-source repositories without checking the exact license/version.
- No production changes while Restore-Test/audit work is running.
- No "PASS" until Browser Gate evidence exists.

---

## 8. Immediate execution order

### Gate R1 — Reuse Audit
Document which existing subsystem is build/reuse/integrate/adapt.

### Gate R2 — Shipping/Tracking
Finish the customer tracking presentation and verify the customer can see:
tracking number, provider/service, ETA, status, and link when available.

### Gate R3 — Shipping Browser E2E
Create a real test shipment through the existing shipment RPC, then verify the customer order page.

### Gate R4 — Returns/Refunds
Study mature open-source return/claim patterns and map them to the existing Velora financial/legal model before implementing.

### Gate R5 — Checkout E2E
Run only after legal acceptance and shipping quote are operational in Restore-Test.

### Gate R6 — Payment settlement
Use real provider test/live evidence only; never infer settlement from local order creation.

### Gate R7 — Legal + Privacy
Continue with the draft pack, but publication remains blocked on real entity/tax/privacy/role details and qualified Egyptian legal review.

### Gate R8 — Security
Close the remaining high-value security findings without broad refactors.

---

## 9. Decision rule for future engineering

Before adding a new subsystem, ask:

1. Is this part of Velora's differentiated value?
2. Is there a mature open-source implementation with a compatible license?
3. Is there an external provider whose core job is to do this?
4. Can we integrate instead of reimplement?
5. What is the smallest change that preserves the current Velora contracts?

Only after those questions are answered should we write new infrastructure.

---

## 10. Current conclusion

The audit supports the user's proposed strategy: **Velora should not rebuild commodity commerce infrastructure from first principles.**

The existing codebase should be treated as a valuable partial implementation, not discarded. The next phase is to identify exactly where mature external patterns can reduce complexity while keeping Beauty Passport/Routine/personalization and the marketplace trust model under Velora's control.

**Next concrete work:** finish the shipping/tracking gap using the already-existing shipment contract, then move through returns/refunds, checkout, settlement, legal, and security in evidence-gated order.


## 11. Evidence update — shipping and returns audit

### OBSERVED FACT — shipping customer UI is already more complete than the earlier audit snapshot

Source inspection of the current audit branch shows the canonical customer order renderer already:
- selects `tracking_number`, `status`, `tracking_url`, `shipped_at`, `delivered_at`, and `estimated_delivery_at`;
- validates tracking URLs to HTTP(S) before rendering a link;
- displays current shipment status;
- displays a Preparing → Shipped → In transit → Delivered progress presentation;
- displays terminal Failed / Returned / Cancelled state;
- displays tracking number, ETA, shipped date, delivered date;
- displays a Track Shipment link when a valid tracking URL exists;
- explains when a tracking number or carrier link is not yet available.

Therefore **R2 does not currently justify another UI rewrite**. The correct next step is browser evidence with a real Restore-Test shipment, not more speculative frontend code.

### OBSERVED FACT — returns/disputes foundations already exist

Restore-Test currently contains:
- `returns`
- `return_items`
- `disputes`
- `support_cases`
- `delivery_proofs`

The database also exposes governed SECURITY DEFINER RPCs:
- `velora_request_return`
- `velora_resolve_return` (two signatures)
- `velora_open_dispute`
- `velora_resolve_dispute`

This changes R4 from **"build a return system"** to **"audit the existing contract and customer/seller UX, then fill only proven gaps."**

### OBSERVED FACT — current E2E evidence is still missing

Current Restore-Test counts show:
- shipments = 0
- return_items = 0
- returns = 0
- disputes = 0
- support_cases = 0
- payment_attempts = 0
- provider_webhook_events = 0
- legal_documents = 0
- legal_acceptances = 0

Therefore none of these lifecycle areas should be marked Browser PASS solely from schema/RPC existence.

### Decision

We are **not adding another shipping table, carrier abstraction, return schema, or custom transport layer now**.

The next engineering step is evidence-first:
1. Inspect the existing shipment RPC contract.
2. Create one controlled Restore-Test shipment for an existing eligible order/item only if the RPC prerequisites are satisfied.
3. Verify customer order/tracking UI in Browser Gate.
4. Inspect existing return/dispute RPCs and UI before writing anything.
5. Only implement a missing surface after an observed gap is reproduced.


## 12. Execution update — 2026-09-26 — post-audit hardening

### OBSERVED FACT — shipping seller creation had a source/DB contract mismatch
The seller shipping UI in `src/scripts/14-seller.js` queried `order_items.status`, but the live Restore-Test `public.order_items` table has no `status` column. The mismatch would fail the seller-side item lookup before the canonical `velora_create_shipment` RPC could run.

**Smallest safe patch:** the UI now selects only the existing `id,quantity` columns and uses positive quantity as the local eligibility filter. Shipment authorization and lifecycle rules remain server-authoritative in `velora_create_shipment`.

Commit: `7caebe5db1cf46f05099f424fe2455f7509c9145`

### OBSERVED FACT — customer shipment presentation includes seller context
The customer order renderer in `src/scripts/00-localization.js` now derives seller/store names from the already-selected order-item `store_id/store_name` fields and displays the seller inside each shipment card.

Commit: `e01eb8caab9cb1043d163bb2fc3804f7411743d1`

### OBSERVED FACT — CI verification
GitHub Actions Run 68 for `e01eb8caab9cb1043d163bb2fc3804f7411743d1` completed with conclusion `success`.

### OBSERVED FACT — Preview verification
Vercel deployment `dpl_EbCsXNnzoYbUdUT6gCZimqfcToK1` for the same commit is `READY`. This is Preview evidence only; it is not Browser PASS.

### OBSERVED FACT — browser gate remains pending
A live Browser Gate was not run because the available browser automation wallet balance is negative. Therefore Shipping/Tracking remains **NOT BROWSER PASS**.

### OBSERVED FACT — returns customer UX is only event recording today
The customer-facing Stage 45 control in `src/scripts/40-payments.js` exposes a **Return / Dispute** action, but that action calls only `velora_record_post_purchase_event('return_started', ...)` and does not call `velora_request_return` or `velora_open_dispute`.

The message shown to the customer states that the request was recorded for the governed workflow, while the current source evidence shows that the actual governed return/dispute object is not created by that action.

### OBSERVED FACT — return backend contract exists and is materially governed
The Restore-Test backend exposes:
- `velora_request_return(order_id, store_id, items, reason, description)`
- canonical 6-argument `velora_resolve_return(..., refund_reference, refund_provider, refund_method)`
- `velora_open_dispute(order_id, store_id, reason, description)`
- `velora_resolve_dispute(dispute_id, status, resolution)`

The request-return RPC requires:
- authenticated customer ownership of the order;
- delivered order status;
- settled payment status (`paid` or `refunded`);
- a valid store belonging to the order;
- concrete order-item IDs and requested quantities;
- a delivered shipment covering the returned quantity;
- no conflicting active return for the same order/store/item.

The canonical return resolver enforces a return state machine and requires refund evidence (`refund_reference`) before transitioning to `refunded`.

### INFERRED — return UX should be split-aware
Because a Velora order can contain multiple stores and the canonical request RPC requires `store_id` plus item IDs/quantities, a one-click generic “Return / Dispute” action is not enough to safely create a return for a multi-seller order. The UI must first expose the affected shipment/store/items and then submit the appropriate governed RPC.

### HYPOTHESIS — no return workflow patch should be made until refund economics are defined
The current `velora_request_return` calculation starts from item unit price × requested quantity. Whether shipping, discounts, commissions, payment-provider fees, seller earnings, pickup/return shipping, or other commercial amounts are refundable/reallocated is a business/legal rule, not something engineering should invent.

### Current gate classification
- Shipping source contract: **PASS**
- Shipping DB contract: **PASS**
- Shipping permissions: **PASS**
- Shipping CI: **PASS**
- Shipping Preview: **PASS**
- Shipping Browser Gate: **PENDING — browser tool unavailable**
- Returns backend contract audit: **PASS**
- Returns customer workflow: **GAP OBSERVED**
- Returns/refund economics: **BLOCKED ON BUSINESS/LEGAL DECISION**


### OBSERVED FACT — return refund execution is not implemented yet
A Restore-Test PostgreSQL function inventory contains no public function with a `refund` name, and the current `src/scripts/13-payments.js` source contains no refund execution path beyond the Stage 9 header/reference.

The canonical 6-argument `velora_resolve_return` therefore records refund evidence fields when a return enters `refunded`, but it does not itself execute a payment-provider refund.

### INFERRED — return resolution and payment refund should remain separate authorities
This separation is consistent with mature commerce architecture: return handling determines the eligible amount/state, while payment infrastructure performs the actual refund transaction and supplies provider-side evidence. Medusa documents refunds as payment transactions and supports dedicated refund workflows; Spree also separates return processing from reimbursement/payment handling. citeturn246475search0turn246475search8turn735097search2turn735097search3

### License/reference note
Current reference checks confirm Medusa's core is MIT-licensed while its Enterprise materials are separately proprietary; Spree's current main repository is BSD-3-Clause for the checked license, and Saleor's core repository is BSD-3-Clause while its storefront carries a separate FSL-1.1-ALv2 license. These are reference/architecture inputs only; no external source code has been copied into Velora. citeturn735097search0turn735097search1turn246475search5turn246475search11
