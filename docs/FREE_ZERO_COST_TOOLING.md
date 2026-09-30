# Velora Zero-Cost Tooling Layer

## Purpose

Velora uses a zero-spend-first execution policy for engineering, QA, browser verification, evidence, and recovery preparation.

The tooling layer must:
- prefer repository-native/open tooling before metered SaaS;
- avoid paid AI/browser agents for routine engineering work;
- keep Production frozen unless an explicit human gate authorizes a production operation;
- use bounded, allowlisted commands rather than an unrestricted shell;
- preserve evidence as small machine-readable records where possible;
- fail closed when a required secret, provider, or capability is unavailable.

## Current zero-cost tools

### 1. Velora Remote Exec

File: `.github/workflows/velora-remote-exec.yml`

Purpose:
- execute bounded repository tests from GitHub Actions;
- usable from ChatGPT through the GitHub connector by changing `.remote/command.json`;
- returns run logs and a short-lived execution artifact.

Current allowlist includes:
- `git status --short --branch`
- `git diff --check`
- `npm run check`
- `npm run test:beauty-ai`
- `npm run test:product-detail`
- `npm run test:platform-reentry`
- `python3 tools/static_audit.py`
- bounded `node --check` for source/test JavaScript files.

No arbitrary shell command is accepted.

### 2. Free Browser Evidence

Repository-native Playwright workflows run on GitHub-hosted standard Linux runners.

Current purpose-specific gates:
- Customer Beauty AI zero-cost E2E
- Canonical Beauty Recommendations E2E
- Seller/Admin re-entry E2E

This removes the mandatory dependency on a metered browser-agent service for these flows.

### 3. Evidence-first operation

For permanent project history, prefer:
- a small JSON/Markdown evidence summary committed to the repository;
- hashes and run IDs rather than copying large logs;
- temporary Actions artifacts only for full raw evidence.

Do not place credentials, tokens, customer secrets, or unencrypted database dumps in the repository.

### 4. DR / Backup preflight

File: `.github/workflows/velora-dr-preflight.yml`

The preflight is zero-cost and does not mutate Production. It verifies whether the credentials required for a real database backup are present, verifies local backup tooling availability, and produces a readiness report.

A real encrypted Production backup remains gated on a deliberately configured database credential and encryption secret. The workflow must never fall back to logging raw credentials or unencrypted data.

## Cost boundary

GitHub documents that standard GitHub-hosted runners are free for public repositories. Velora's repository is currently public. Artifact/storage allowances and platform policies can change, so "zero cost" means no intentional metered provider dependency in the current design, not a contractual guarantee that a third-party service will never change its limits.

Sources:
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/pages/getting-started-with-github-pages

## Non-replaceable human gates

A local tool cannot legally or operationally replace:
- identity/document renewal;
- final legal publication;
- tax/entity/Merchant-of-Record classification;
- irreversible production financial actions;
- provider-side account upgrades or paid-plan capabilities.

Those remain human/provider gates in the Master Plan.

## Design rule

Every new blocked-by-tool/cost item should first be evaluated against this sequence:

Existing capability -> repository-native replacement -> bounded local/CI implementation -> free external API only when essential -> paid provider only if no safe zero-cost path exists.

Never build a second business authority merely to avoid an external tool.


## 5. Zero-Cost Commerce Lab

File: `tools/velora_zero_cost_commerce_lab.py`
Workflow: `.github/workflows/velora-zero-cost-commerce-lab.yml`

Purpose:
- deterministically execute checkout / cancellation / returns / subscription / advertising / payout state-machine scenarios;
- verify that existing canonical source owners still exist;
- produce machine-readable evidence without a database write or provider call.

Important boundary:
- simulation only;
- it cannot create legal, tax, provider, bank, or Production evidence;
- proposed commercial policies are marked NOT ACTIVE and are never silently enabled.

## 6. Zero-Cost Restore-Test Commerce Evidence

File: `.github/workflows/velora-zero-cost-commerce-evidence.yml`

Purpose:
- fixed, read-only probes of Restore-Test subscription, advertising, payment, payout, return, legal, and provider state;
- no arbitrary SQL;
- no write capability;
- no Production connection.

This turns repeated manual DB snapshots into a repeatable evidence artifact.

## 7. Zero-Cost Provider Contract Lab

File: `tools/velora_provider_contract_lab.py`
Workflow: `.github/workflows/velora-zero-cost-provider-contract-lab.yml`

Purpose:
- deterministic provider-contract emulation for intention shape;
- SHA-512/HMAC webhook validation;
- tamper rejection;
- duplicate-event/idempotency behavior;
- late-capture reconciliation boundary;
- missing-client-secret recovery boundary.

This does NOT call Paymob and therefore never counts as live Provider PASS.


## 8. Zero-Cost Financial Reconciliation Lab

Files:
- `tools/velora_financial_reconciliation_lab.py`
- `.github/workflows/velora-zero-cost-financial-reconciliation-lab.yml`
- `.github/workflows/velora-zero-cost-financial-evidence.yml`
- `.remote/financial-reconciliation.json`

Purpose:
- verify canonical financial invariants without creating data;
- validate commission arithmetic, payout-to-ledger shape, purpose-specific payment bindings, and return/refund evidence gates;
- create a repeatable, fixed read-only Restore-Test evidence snapshot.

Current live Restore-Test evidence:
- 20 commission rows; 0 commission arithmetic errors;
- 0 payouts and 0 payout items;
- 64 payment attempts; 0 subscription binding errors; 0 seller-ad binding errors;
- 0 returns and 0 refunded returns with evidence errors;
- 0 seller-ad campaigns / seller-ad payment attempts, so positive advertising accounting remains NOT EVIDENCED rather than fabricated;
- reconciliation invariants = true.

Important boundary:
- the evidence workflow is fixed read-only and Restore-Test only;
- no payout, return, ad campaign, subscription, provider settlement, or real-money fixture is created;
- a passing reconciliation invariant does not prove external provider/bank settlement or Production readiness.

## 9. Zero-Cost COD Contract Lab

Files:
- `tools/velora_zero_cost_cod_lab.py`
- `.github/workflows/velora-zero-cost-cod-lab.yml`
- `.github/workflows/velora-zero-cost-cod-evidence.yml`
- `.remote/cod-lab.json`

Purpose:
- verify the current Egypt/EGP COD route from the existing payment contract;
- keep COD explicitly classified as `manual_tender`, not provider settlement;
- prove negative geography/currency gating without mutating orders or creating payment fixtures.

Current live Restore-Test evidence:
- `velora_get_operational_payment_methods('EG','EGP')` returns Card via Paymob TEST and Cash on Delivery via the existing cash-on-delivery route;
- `US/USD` and `EG/USD` return no operational payment methods under the current function contract;
- no order/payment mutation was executed.

Boundary:
- this verifies payment-method availability and guard shape only;
- cash collection, delivery reconciliation, refunds, bank settlement, and Production payment operations remain separate evidence gates.
