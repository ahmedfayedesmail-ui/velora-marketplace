# Velora Revenue-First Launch Checklist
Status: ACTIVE
Date: 2026-09-30
Branch: audit/runtime-parity-2026-09-28

## Objective
Reach the first legitimate live Velora transaction with the smallest safe founder cash outlay.

## Founder cash rules
- Initial cash ceiling: 10,000 EGP.
- Recurring founder support ceiling: 5,000 EGP/month.
- No recurring discretionary cost above the monthly ceiling without explicit owner approval.
- No founder inventory purchase for the initial marketplace launch.
- Production remains frozen until release gates are satisfied.

## Step 1 — Legal / entity / tax classification
STATUS: OPEN — HUMAN GATE

Before payment of any setup fee:
1. Confirm the legally appropriate Egyptian structure for a one-owner marketplace.
2. Confirm whether Velora acts as marketplace/intermediary or seller of record.
3. Confirm money flow: customer -> provider/Velora -> seller and who invoices the customer.
4. Confirm tax turnover basis for the platform and applicable income/VAT treatment with a qualified Egyptian tax professional.
5. Retrieve the exact government fee total from the official GAFI application for the selected structure.
6. Check e-invoice/e-receipt applicability for the actual B2B/B2C flow.

Official evidence checked 2026-09-30:
- GAFI publishes a sole-proprietorship fee schedule showing commercial registration, chamber and GAFI service fees, while tax card/VAT registration are listed as no-fee items.
- GAFI publishes a separate one-person-company fee schedule with fees depending on capital and service selections.
- ETA states the simplified tax regime applies to eligible projects with annual turnover up to 20M EGP, with rates from 0.4% to 1.5% by turnover bracket.
- ETA states the mandatory VAT registration threshold is 500,000 EGP, subject to applicable exceptions/rules.
- ETA states e-invoicing is for B2B transactions and e-receipt applies to B2C when the taxpayer is subject to the relevant obligation.

Sources:
- https://www.gafi.gov.eg/
- https://www.eta.gov.eg/

## Step 2 — Production capacity
STATUS: BLOCKED/PENDING

- Obtain an exact-current-HEAD Vercel Preview when deployment capacity permits.
- Keep Production frozen.
- Do not claim Preview/Production readiness from source or local Browser evidence.
- Use the least-cost commercial configuration that meets the real launch requirement.

Current published pricing references:
- Vercel Pro: $20/month, excluding applicable taxes.
- Supabase Pro: $25/month; first project included with $10/month compute credits covering one Micro instance.

## Step 3 — Payment provider
STATUS: OPEN — HUMAN/PROVIDER GATE

- Complete Paymob merchant onboarding.
- Obtain live merchant credentials and settlement/bank details.
- Verify production webhook/HMAC configuration.
- Define reconciliation ownership and refund handling.
- Keep sandbox evidence separate from live settlement evidence.

## Step 4 — Shipping / COD
STATUS: OPEN — COMMERCIAL CONTRACT GATE

- Select one initial courier route.
- Obtain written/current tariff, COD collection fee, remittance timing, failed-delivery, return and refund terms.
- Preserve existing canonical COD routing; do not create a second payment/shipping engine.

## Step 5 — Seller supply
STATUS: OPEN — BUSINESS EXECUTION

Target:
- 3–5 legitimate initial sellers.
- 20–30 real products.
- Real stock and fulfillment capability.
- Seller approval and commercial terms agreed.

## Step 6 — First customer acquisition
STATUS: OPEN — BUSINESS EXECUTION

Initial approach:
- seller audiences;
- organic beauty content;
- referrals;
- low-cash partnerships/micro-creators where commercially sensible.

Rule:
- no material paid advertising plan before first conversion/order economics are observed.

## Step 7 — First transaction
STATUS: NOT EVIDENCED

Required live sequence:
customer -> real product -> cart -> checkout -> card/COD -> order -> fulfillment -> commission -> reconciliation.

The first real transaction must be separately evidenced; simulations and Restore-Test runs do not count as market revenue.

## Step 8 — Unit economics
STATUS: OPEN

For every real order record:
- GMV
- Velora commission
- payment fee
- shipping/COD allocation
- refunds/returns
- tax/accounting treatment
- seller payout obligation
- net contribution to Velora

Self-funding gate:
- measured monthly contribution covers the 5,000 EGP founder operating ceiling.
- only after repeated positive economics should founder withdrawal/reinvestment increase.

## Immediate founder action
NONE before the legal checklist is finalized.

When the legal gate is reached:
- use the renewed identity/documents only on official government/provider portals;
- do not send national ID numbers, bank credentials, Paymob secrets, or tax credentials in chat.

## Cost guardrails
- Initial founder budget: <=10,000 EGP.
- Recurring founder support: <=5,000 EGP/month.
- No initial inventory purchase by founder.
- Do not assume 150,000 EGP is a mandatory government tax-ID/setup cost.
- Exact setup cost depends on the selected legal structure and official application result.

## Evidence boundary
Source/DB/CI/Preview/Browser/Provider/Production evidence must remain distinct. A passing lab or Restore-Test probe never substitutes for a live provider, legal, market or Production gate.
