# Paymob Restore-Test Runtime Provenance — 2026-09-28

## Scope
Restore-Test only. No Production changes.

## Observed runtime
- `velora-paymob-checkout`: ACTIVE, version 14
- `velora-paymob-webhook-restore-test`: ACTIVE, version 26
- Checkout runtime checksum: `8a3693a221d9335a0fa6a57368db4ca6646ca9e1f65ca9e208249264b28fb036`
- Webhook runtime checksum: `f12b157082ea85e114c8f1d06c8039250d2b1c0e60db1af65bb44b55b434da0c`

## Repository parity finding
The repository did not expose `velora-paymob-checkout` in GitHub code search on the accessible branches. The existing Restore-Test webhook source on the evidence branch was older than runtime version 26.

## Action taken
The active Restore-Test runtime sources were snapshotted onto branch `audit/runtime-parity-2026-09-28` without deploying them:
- `supabase/functions/velora-paymob-checkout/index.ts`
- `supabase/functions/velora-paymob-checkout/deno.json`
- `supabase/functions/velora-paymob-webhook-restore-test/index.ts`

This snapshot is provenance recovery, not proof that the runtime is the desired final contract.

## Next gate
Before deploying any change:
1. Reconcile provider-start failure compensation.
2. Reconcile captured marketplace order lifecycle.
3. Preserve subscription and seller-ad webhook branches.
4. Run tests and CI on the exact candidate SHA.
5. Deploy Preview / Restore-Test only, then Browser/Provider evidence.
6. Production remains frozen.
