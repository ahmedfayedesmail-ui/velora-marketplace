# Velora — Seller Onboarding Control Plane Evidence
## 2026-09-25

Environment: Restore-Test `arlaxqmhtvjwjbjinjfw`  
Production: FROZEN / NOT TOUCHED

## Implementation

`public.seller_onboarding_cases` is now an evidence/review layer separate from canonical `public.sellers`.

The case tracks:
- application status
- identity verification
- authenticity
- catalog review
- seller SLA acceptance
- pilot status
- business/contact metadata
- evidence references
- reviewer and lifecycle timestamps

Direct client INSERT/UPDATE/DELETE privileges are not part of the intended mutation path. Staff changes use the governed onboarding RPC and are audited.

## Beta-ready gate

A seller is only operationally beta-ready when:
- application = approved
- identity = verified
- catalog = approved
- seller SLA = accepted
- pilot = active or passed
- authenticity = verified or explicitly not required

This is an operational readiness rule. It is not a legal opinion and does not replace KYC, tax, licensing, or counsel requirements.

## Current Restore-Test state

One seller onboarding case exists because the existing approved seller was backfilled into the new control plane.

Current case state:
- application: approved
- identity: pending
- authenticity: pending
- catalog: pending
- SLA: pending
- pilot: not_started

Therefore the current test seller is **not beta-ready** under the new gate.

Production remains frozen.
