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
