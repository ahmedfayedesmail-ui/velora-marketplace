# Velora — Trust Governance Hardening Evidence
## 2026-09-25

Environment: Restore-Test `arlaxqmhtvjwjbjinjfw`  
Production: FROZEN

## Completed hardening

### Beauty context
- Egypt-local context uses `Africa/Cairo`.
- Calendar season mapping is explicit for all 12 months.
- Routine context is server-authoritative.
- Browser time is not authoritative.
- Routine UI refreshes when the server-reported Egypt-local date changes.
- Live weather is not claimed as active personalization.

### Checkout
- Customer checkout reference is unique per customer.
- Commercial wrapper returns the existing order immediately on an idempotent hit.
- Coupon/promotion/gift-card application is not repeated for an idempotent replay.
- Server recomputes shipping from the submitted cart and compares the client quote.
- Missing shipping configuration and quote mismatch fail closed.

### Returns / shipping
- Direct client table CRUD on returns is removed.
- Return requests require a delivered order and delivered shipment item.
- Refund completion requires an explicit refund reference.
- Return state transitions are governed.
- Shipment creation no longer relies on nonexistent order-item status or `min(uuid)`.
- Shipment state remains the fulfillment source of truth.

### Privacy
- Direct client table CRUD is removed from privacy consent/request tables.
- Privacy requests are idempotent while active.
- The active-request index uses the real statuses: requested, reviewing, approved, processing.
- Privacy state changes are audited.
- Consent changes are audited.

### Disputes
- Direct client table CRUD is removed.
- Customer/staff visibility is policy-scoped.
- Opening and resolution use governed RPCs.
- Active duplicate disputes for the same customer/order/store are blocked.
- Terminal resolution requires resolution evidence.

### Legacy recommendation ACL
- Direct table CRUD on legacy recommendation tables is removed.
- Legacy recommendation access remains RPC-only and authenticated.

### Invoices / tax
- Direct client invoice writes are removed.
- Customer/staff invoice reads remain policy-scoped.
- Manual invoice preparation is staff-only and reconciles back to the canonical order total.
- No generic tax percentage is hard-coded.
- Actual ETA/e-invoice/e-receipt compliance remains a pre-launch accounting/provider/legal gate.

## Known remaining verification gates

- Browser E2E for checkout, Beauty Passport, returns UI, mobile/desktop and localization.
- Paymob live/test settlement evidence.
- External carrier selection/integration.
- Bank/payout settlement integration.
- Final legal documents and Arabic review.
- Tax/invoicing operating model.
- Privacy legal-role/data-map review.
