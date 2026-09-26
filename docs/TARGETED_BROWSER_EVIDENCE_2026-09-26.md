# Velora — Targeted Browser Evidence
## 2026-09-26

Environment: Vercel Preview for audit/full-gate-2026-09-25
Preview deployment: dpl_6z7sVTaDLaf5wrEo79fodfPao6Ew
Preview URL: https://velora-marketplace-koh7wao4t-ahmedconccc-7063.vercel.app/
Evidence runner: GitHub Actions isolated branch evidence/browser-gate-2026-09-26
Evidence run: Browser Gate Run #8 (36262943551)
Head tested by Preview: 8cbdbd142e6e2c21d0c4e57f9da56aaece959d81

### OBSERVED FACT — browser localization/render evidence

A real Chromium browser executed against the deployed Preview and recorded:
- HTTP status: 200
- initial document language: en
- initial direction: ltr
- after selecting Arabic: document.lang = ar
- after selecting Arabic: document.dir = rtl
- language selector value = ar
- VELORA_GET_TRANSLATION('Shipping Information','ar') = 'معلومات الشحن'
- Checkout rendered Arabic "Shipping Information"
- Checkout rendered Arabic "Payment Method"
- Checkout rendered Arabic "Summary"
- Checkout rendered Arabic "Place Order"
- page errors: 0

The test used an in-memory/local browser fixture for the canonical Restore-Test product and did not create an order, payment attempt, legal acceptance, or production mutation.

### Evidence boundary

This is targeted Browser Evidence for locale switching and Checkout rendering. It is NOT a full authenticated customer E2E, payment-provider settlement proof, webhook-provider proof, legal acceptance proof, backup/restore proof, or production cutover approval.

The browser runner observed expected 401 responses from unauthenticated protected calls. These were not treated as Checkout failures because the targeted assertion was rendering behavior, not authenticated commerce execution.

### Decision

Do not mark the global e2e_tests Launch Gate PASS from this evidence alone. The evidence proves the targeted localization/render surface and should be carried forward into the Browser Gate evidence pack.
