# Velora — Existing Surface / Reuse-First Execution Backlog
## 2026-09-26 — do not build a second system

Production is FROZEN. Scope is Restore-Test + audit/full-gate-2026-09-25.

## 1. Surfaces already present

Customer storefront pages:
- Home
- Shop
- Shops
- Deals
- Guide
- Blog
- Compare
- Reviews
- Wishlist
- Cart
- Checkout
- Orders
- Account
- Legal

Canonical Seller Center already exposes:
- Dashboard
- Products
- Inventory
- Orders
- Store Settings
- Shipping

Canonical Admin already exposes:
- Dashboard
- Sellers
- Products
- Orders
- Users
- Audit Logs
- Seller Applications
- Seller Onboarding
- Trust & Compliance
- Shipping
- Payments
- Release Control

## 2. Reuse-first mapping

Home → keep current beauty-first hero/routine journey. Reuse patterns from mature beauty storefronts; do not rebuild the homepage framework.
Shop → keep search/filter/sort and canonical catalog. Remove only generic category leakage and stale compatibility fallback.
Shops → keep seller discovery surface; reuse merchant-card patterns rather than inventing a store platform.
Deals → keep the existing page and make the data source canonical/backend-authoritative.
Guide/Blog → existing content surfaces; only improve content/modeling when an observed requirement exists.
Compare → existing capability; keep it out of the critical checkout path.
Reviews/Wishlist → existing commodity features; no subsystem rewrite.
Cart → canonical server cart already exists; do not create a second cart.
Checkout → canonical order creation/payment method/shipping quote/legal gate already exist; only harden observed gaps.
Orders → existing customer order view + shipment data; adapt to mature split-shipment patterns.
Account → existing profile, orders, privacy/data controls; keep one canonical Supabase identity.
Legal → keep governed document/version/acceptance architecture; legal content remains a counsel-controlled input.

Seller Center → use the current canonical seller navigation as the operating model. Add a screen only when a real task is missing.
Admin → treat the current Admin as the operating hub. Add navigation/controls, not a new dashboard application.

## 3. Highest-leverage reference patterns

Seller dashboard: task-first attention + KPIs + quick actions. Etsy Shop Manager and eBay Seller Hub are useful references.
Admin: central navigation + search + operational sections. Shopify Admin is a useful information-architecture reference.
Marketplace orders: aggregate customer order with merchant/seller grouping and shipment boundaries. Spryker and Medusa provide clear reference patterns.
Fulfillment: fulfillment/shipment record with items, quantities, status, tracking and delivery details. WooCommerce and Spryker provide reference patterns.
Returns: merchant/item-scoped return requests and explicit state transitions. Spryker provides a close marketplace reference.
Refunds: distinguish physical return from actual money movement; gateway refund and manual COD refund are separate cases. WooCommerce documents this clearly.
Promotions: conditions + actions + constraints, server-authoritative. Vendure provides a clean model.
Beauty personalization: goal/concern-driven recommendation, comparison, explanations and routine guidance. Ulta and Sephora provide the product-side reference.

## 4. Current proven gaps worth engineering

1. Real provider adapters: payment/shipping/email/tax are integration work, not custom infrastructure.
2. Browser-verified shipment lifecycle: the backend and UI exist; live browser proof is still required.
3. Split-aware customer return workflow: current backend requires store + item/quantity context; fill only this surface after refund economics are defined.
4. Consent/version governance: do not invent a new privacy-version schema before legal governance is approved.
5. Auth configuration polish: deployed-host email confirmation/redirect behavior must use the canonical Velora host, not localhost.

## 5. Current gaps explicitly NOT worth building now

- New cart architecture
- New order architecture
- New notification platform
- New search engine
- New analytics warehouse
- New carrier network
- New payment engine
- New seller backend
- New admin framework
- Generic recommendation engine replacing Beauty Passport
- New image platform

## 6. Acceptance rule for every future change

Before implementation, record:
1. Existing Velora component or contract.
2. Reference implementation or official pattern.
3. Exact observed gap.
4. Smallest safe change.
5. Source/CI evidence.
6. Preview evidence.
7. Browser evidence when the change is user-facing.

Do not implement because a competitor has a feature. Implement only when Velora needs the capability and the current architecture cannot already provide it.

## 7. Current direction

Velora's differentiation stays in Beauty Passport + Routine Intelligence + personalization + Arabic-first beauty journey + marketplace trust.
Everything else should be treated as commerce plumbing: reuse an existing Velora contract, adapt a mature pattern, or integrate a provider.

That is the default engineering posture for the remainder of the project.