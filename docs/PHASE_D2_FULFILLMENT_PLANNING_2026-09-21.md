# Velora — Phase D2 Fulfillment Planning
## Curated Seller Fulfillment Operating Model — 2026-09-21

**Status:** **PLANNING ONLY / READY FOR OWNER-OPERATIONS REVIEW**  
**Phase:** Phase D — Operations / Trust / Economics  
**MVP Fulfillment Model:** **Curated Sellers**  
**Production:** **FROZEN**  
**Carrier Decision:** **NOT SELECTED**

## 1. Objective

Define the Beta fulfillment operating model without turning Phase D into implementation or embedding commercial policy inside the Routine Engine.

Approved MVP model:

**Curated Sellers**

The Beta seller pool is intended to remain controlled rather than becoming an unmanaged open marketplace.

## 2. Core Architectural Rule

**Routine ≠ Order ≠ Shipment**

Approved commerce flow:

`Routine → Routine Items → Cart → Order → Seller Fulfillment Units → Shipments`

One Routine can produce:

- one customer Order;
- multiple seller/store fulfillment units;
- multiple shipments.

Split shipment is therefore a normal supported case, not an exception to hide from the customer.

## 3. Existing Commerce Primitives

The current Restore-Test schema already contains the basic primitives needed for the model:

### `order_items`

Contains, among other fields:

- `order_id`
- `seller_id`
- `store_id`
- `product_id`
- `product_variant_id`
- quantity / pricing fields

### `shipments`

Contains:

- `order_id`
- `store_id`
- carrier/service fields
- tracking number / tracking URL
- shipment status
- estimated delivery

### `shipment_items`

Contains:

- `shipment_id`
- `order_item_id`
- quantity

This means a logical seller/store fulfillment unit can be represented by the relevant order items grouped by `store_id`, while each shipment references the resulting subset of items.

No new fulfillment schema is required by this planning document.

## 4. Seller Fulfillment Unit

For planning purposes:

**Seller Fulfillment Unit = the set of Order Items for one seller/store within one Order that are operationally fulfilled together.**

Example:

`Order #X`

→ Seller A items

→ Seller B items

→ Seller C items

Each unit can produce its own shipment lifecycle.

This preserves one customer-facing order while allowing independent seller fulfillment.

## 5. Proposed Operational Lifecycle

Conceptual flow:

`Order Confirmed`

→ `Fulfillment Units Identified`

→ `Seller Accepts / Prepares`

→ `Shipment Created`

→ `In Transit / Tracking`

→ `Delivered`

Exception branches:

- failed
- cancelled
- returned

The exact operational SLA thresholds are not defined by Engineering.

## 6. Existing Shipment RPC Observation

The existing:

`public.velora_create_shipment(...)`

already enforces important boundaries:

- shipment items must belong to one store;
- order must be shippable;
- payment must be settled;
- items must be in a shippable state;
- an already-shipped item cannot be shipped again;
- shipment item quantities come from the order items.

Current implementation creates the shipment with status `in_transit`.

That is an implementation detail to reconcile with the final Beta operating lifecycle; this planning document does **not** change it.

## 7. Shipping Adapter Pattern

Engineering should treat the carrier as an interchangeable provider behind a Velora abstraction.

Capability-level contract:

- create shipment;
- create/obtain label where supported;
- obtain tracking status;
- retrieve tracking link;
- cancel shipment where supported;
- initiate return pickup where supported;
- surface provider error states.

The domain layer should operate on Velora shipment concepts, not carrier-specific business rules.

## 8. Carrier Neutrality

No commercial carrier is selected by this document.

The system should remain capable of connecting a first provider without requiring the product model or Routine Engine to know the provider's identity.

A second carrier can be added later through the same adapter boundary.

## 9. Split Shipment Customer UX

Customer-facing behavior should clearly communicate:

- one order;
- how many seller shipments are expected;
- which items belong to each shipment;
- current shipment status;
- tracking information;
- expected delivery information when available.

The UX must not imply that an entire Routine necessarily arrives in one package.

## 10. Shipping Cost / Commercial Boundary

This document does not decide:

- who pays shipping;
- seller shipping contribution;
- Velora shipping subsidy;
- free-shipping threshold;
- return shipping liability;
- commission impact on shipping.

Those remain Owner/Product commercial decisions.

## 11. Returns

Return flow should be modeled at shipment/order-item level:

`Customer Return Request`

→ `Affected Seller/Shipment Identified`

→ `Return Pickup / Drop-off`

→ `Seller Inspection`

→ `Resolution`

→ `Refund / Replacement according to approved policy`

Split shipments mean a return may affect one seller shipment without automatically treating every item in the order as returned.

Final eligibility and economics remain governed by D3 policy + Owner decisions + legal review.

## 12. Tracking

Tracking should have two layers:

### Customer layer

Simple lifecycle:

`Preparing → Shipped → In Transit → Delivered`

plus clear exception messaging.

### Operations layer

Detailed provider status mapping, timestamps, tracking IDs, and investigation evidence.

Provider-specific status names must be normalized by the adapter.

## 13. Seller SLA Planning

Each curated seller should accept an agreed operating standard covering:

- order acceptance;
- preparation;
- dispatch;
- stock accuracy;
- return response;
- operations escalation.

Initial thresholds are not to be invented by Engineering.

## 14. Operational Failure Modes

Beta process should explicitly handle:

- seller rejects/cancels item;
- item becomes unavailable after checkout;
- seller misses dispatch SLA;
- carrier pickup failure;
- lost shipment;
- returned shipment;
- partial order delivery;
- one seller succeeds while another fails;
- customer reports missing item.

The resolution path should preserve truthful order/shipment state instead of collapsing multiple seller outcomes into one misleading status.

## 15. Engineering Boundary

Later engineering may implement:

- fulfillment-unit read model;
- shipment adapter interface;
- provider mapping;
- split-shipment customer view;
- tracking normalization;
- return linkage.

This document does not authorize those schema/UI changes.

## 16. Owner / Operations Decisions Before Beta

Still Owner/Product-owned:

1. Commission %
2. Seller commercial terms
3. Shipping-cost treatment
4. Refund economics
5. Service-level thresholds
6. Final carrier/provider commercial agreement

**Carrier identity is intentionally not selected now.**

## 17. Exit Gate

D2 is ready to leave planning when Owner/Operations can answer:

- Which 5–10 sellers are in Beta?
- What seller SLA do they accept?
- How are split shipments communicated?
- Which carrier/provider is contracted?
- Who owns shipment exceptions?
- Who absorbs shipping/return costs under each approved policy case?
- What happens when one seller fails while another succeeds?

## 18. Non-goals

- no carrier selection;
- no production shipment changes;
- no commercial pricing;
- no subscription work;
- no warehouse investment;
- no hybrid fulfillment;
- no Routine Engine changes.

**D2 = PLANNING READY FOR OWNER / OPERATIONS REVIEW**
