# Velora — Phase D4 Unit Economics Framework
## Beta Unit Economics Planning — 2026-09-21

**Status:** **PLANNING ONLY / READY FOR OWNER-PRODUCT REVIEW**  
**Phase:** Phase D — Operations / Trust / Economics  
**Production:** **FROZEN**  
**Commercial implementation:** **NOT AUTHORIZED**

## 1. Objective

Provide one shared model for evaluating Beta unit economics without encoding commercial policy in the Routine Engine or inventing Owner decisions.

The model separates:

**Owner Inputs** from **Model Mechanics**.

## 2. Owner Inputs — Not Engineering Decisions

The following values remain Owner/Product controlled:

- Commission / take-rate percentage.
- Subscription pricing and package structure, if used in Beta.
- Seller commercial terms and payout terms.
- Refund economics.
- Shipping-cost treatment and subsidy rules.
- CAC assumptions and target ranges.
- Retention / reorder assumptions.
- Payment-fee assumptions when provider terms become known.
- Any minimum-margin or contribution target used as a commercial gate.

Every populated value should carry:

- source;
- date;
- geography;
- channel;
- currency;
- scenario;
- confidence / evidence status.

Unknown values remain **TBD**, not estimated silently.

## 3. Core Model Definitions

### AOV

Average order value:

`AOV = GMV / completed orders`

Use the same period, population, currency, and order definition for numerator and denominator.

### GMV

Gross merchandise value:

`GMV = Σ order merchandise value before marketplace take`

The exact inclusion/exclusion of discounts, taxes, shipping, and cancelled/refunded orders must be defined consistently in the model.

### Take Rate

`Take Rate = marketplace commission revenue / GMV`

This should not be hard-coded as 12% or any other value until Owner approves it.

### Net Marketplace Revenue

A simple contribution-oriented starting point:

`Net Marketplace Revenue = commission revenue + other approved marketplace revenue - payment fees - refunds borne by Velora - shipping subsidy borne by Velora`

Subscription revenue may be modeled separately if subscription is actually active.

## 4. Order-Level Contribution

For a completed order:

`Contribution Margin = Marketplace Revenue - variable payment costs - variable fulfillment/shipping costs - refunds/returns borne by Velora - other directly variable costs`

Do not mix fixed operating expenses into this metric unless a separate fully loaded margin is explicitly labeled.

## 5. Seller Economics

At the order-item level:

`Seller Gross Sales = seller item revenue before marketplace deductions`

`Commission Amount = Seller Gross Sales × Owner-approved commission rate`

`Seller Earnings = Seller Gross Sales - approved deductions`

The current database already stores commission-related order-item fields.

Do not change the existing commission rate or formulas during D4 planning.

## 6. CAC

Customer acquisition cost should be tracked consistently:

`CAC = attributable acquisition spend / acquired customers`

An order-level CAC proxy can be used for scenario analysis, but it must be labeled as a proxy and not confused with customer CAC.

Separate at minimum:

- paid social;
- organic;
- referral;
- blended.

## 7. Retention / Reorder

Track:

- repeat purchase rate;
- time to second order;
- orders per active customer;
- cohort retention;
- reorder interval.

The external critique's reorder assumptions remain hypotheses until Beta data validates them.

## 8. LTV Scenarios

LTV should be modeled in scenarios rather than treated as one fact.

A simple contribution-based scenario:

`LTV = contribution per order × expected orders per customer over the modeled horizon`

Use multiple horizons/scenarios, for example:

- conservative;
- base;
- upside.

Do not convert an assumed AOV or CAC into an asserted LTV without exposing the assumptions.

## 9. CAC Payback

One useful planning measure:

`CAC Payback Orders = CAC / contribution per order`

Or in time terms:

`CAC Payback Time = CAC / expected monthly contribution per acquired customer`

The model must distinguish contribution before and after refunds where relevant.

## 10. Break-even

Order-level contribution break-even:

`Break-even Orders = fixed period operating costs / contribution per order`

If contribution per order is zero or negative, break-even orders are undefined / not economically reachable under that scenario.

This is a formula, not a forecast.

## 11. Scenario Table

Recommended scenario fields:

| Input | Conservative | Base | Upside |
|---|---:|---:|---:|
| AOV | Owner input | Owner input | Owner input |
| Take rate | Owner input | Owner input | Owner input |
| Payment fee/order | Owner input | Owner input | Owner input |
| Shipping cost/order | Owner input | Owner input | Owner input |
| Velora shipping subsidy | Owner input | Owner input | Owner input |
| Refund rate | Owner input | Owner input | Owner input |
| Refund cost/order | Owner input | Owner input | Owner input |
| CAC | Owner input | Owner input | Owner input |
| Orders/customer/year | Owner input | Owner input | Owner input |

No values should be populated from the external critique without labeling them as assumptions and recording their provenance.

## 12. Important Beta Metrics

Track at minimum:

- orders;
- completed orders;
- cancelled orders;
- refunded orders;
- GMV;
- AOV;
- commission revenue;
- payment fees;
- shipping revenue/cost;
- shipping subsidy;
- refund cost;
- contribution margin/order;
- CAC by channel;
- repeat order rate;
- orders/customer;
- time to second order;
- LTV scenario vs actual cohort contribution.

## 13. Marketplace + Split Shipment Consideration

Because Velora's approved MVP permits split shipment:

Shipping economics should distinguish:

- orders;
- seller/store fulfillment units;
- shipments.

One order may generate multiple shipments.

Therefore:

`Shipping Cost per Order ≠ necessarily Shipping Cost per Shipment`

Do not evaluate shipping economics using only order count.

## 14. Routine-Specific Boundary

Beauty Routine itself is not a commercial calculator.

The Routine Engine must not inspect:

- commission rate;
- CAC;
- seller payout;
- subscription price;
- shipping subsidy;
- refund economics.

Routine can expose the product-selection total in EGP as part of the approved product contract.

Commercial calculations start after the product-selection/order boundary.

## 15. Data Quality

Every economic metric should define:

- time period;
- population;
- inclusion/exclusion rules;
- currency;
- gross vs net semantics;
- treatment of discounts;
- treatment of taxes;
- treatment of cancellations/refunds;
- seller vs Velora responsibility.

Do not compare numbers with different definitions.

## 16. Decision Gates

D4 planning is complete when Owner/Product has supplied or explicitly marked TBD:

1. Commission rate.
2. Subscription pricing, if applicable.
3. Seller payout/commercial terms.
4. Refund economics.
5. Shipping-cost treatment.
6. CAC assumptions or measurement plan.
7. Retention/reorder assumptions or measurement plan.

After those are supplied, Engineering/Product can populate the model mechanics without changing Routine rules.

## 17. Non-goals

- no commission implementation;
- no subscription implementation;
- no pricing change;
- no shipping-provider selection;
- no refund-policy implementation;
- no Routine Engine changes;
- no production financial configuration.

**D4 = PLANNING READY FOR OWNER / PRODUCT REVIEW**
