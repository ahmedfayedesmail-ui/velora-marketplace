# Paymob Restore-Test Webhook Fix — 2026-09-25

Finding: Restore-Test `velora-paymob-webhook-restore-test` version 16 referenced `eventId` and `hash` before their declarations in the transaction callback path.

Impact: could cause a runtime ReferenceError before webhook event recording.

Fix: reorder initialization so purpose/state, SHA-256 payload hash, eventId, and duplicate-event lookup are established before the internal webhook event RPC is invoked.

Deployment: Restore-Test Edge Function version 17 is ACTIVE.

Verification: deployed source confirms `const hash`, `const eventId`, and duplicate-event lookup occur before `velora_record_webhook_event_internal`.

Boundary: Production was not changed.