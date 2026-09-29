# Velora Production DR / Backup / Rollback Runbook

Status: CONTROL ARTIFACT — NOT EXECUTED
Production: FROZEN
Restore-Test: `arlaxqmhtvjwjbjinjfw`
Production project: `cogplqokzxqaedvjxbwu`

## Purpose

Define the exact evidence path required before Velora Production can be considered recoverable and rollback-ready.

This document is a runbook and control artifact. It does not claim that Production backups, restores, RPO/RTO, or rollback have been successfully exercised.

## Non-negotiable boundaries

1. Never run restore, destructive reset, rollback, or migration replay against the Production project during preparation.
2. Use Restore-Test or a separately approved non-Production environment for rehearsal.
3. Never put Supabase access tokens, database passwords, webhook secrets, VAPID private keys, or provider credentials in Git.
4. Existing DR tables and release blueprints are evidence containers, not proof of recovery.
5. Do not create a second DR engine or second release-control model.
6. A successful Vercel deployment is not a database recovery test.
7. A database backup is not a Storage-object backup; Storage assets need an explicit inventory/recovery procedure.

## Evidence levels required

### L1 — Source / control

Record:
- exact Git commit SHA
- exact migration set
- exact Edge Function versions
- exact Vercel deployment identity
- exact Supabase project refs
- exact release candidate identifier

### L2 — Backup inventory

For the relevant environment, record:
- backup mechanism
- backup creation timestamp
- backup artifact identifier
- retention period
- storage/off-site location
- checksum or integrity identifier where available
- scope: database schema/data versus Storage objects

For the current Free-plan organization, the primary controlled logical-backup route is an explicit Supabase CLI `db dump` export followed by an off-site copy. Supabase's current documentation recommends regular CLI exports and off-site backups for Free-plan projects; daily downloadable backups are a paid-plan capability. Cite the current official backup documentation in release evidence.

### L3 — Restore rehearsal

Rehearse on Restore-Test or another disposable non-Production environment:
1. establish the pre-rehearsal state fingerprint;
2. create or obtain the backup artifact;
3. restore into the non-Production target;
4. verify schema/migration state;
5. verify critical control-plane rows;
6. verify auth-sensitive functions/RLS expectations;
7. verify representative customer, seller, order, payment, notification, routine, and catalog read paths;
8. verify that no provider production credential is used;
9. record elapsed restore time;
10. record data-loss boundary relative to the chosen restore point.

Do not call this a Production restore test.

### L4 — Application reconciliation

After a non-Production restore, verify:
- Product/catalog canonical reads
- Seller identity and approval state
- Customer Passport V2
- deterministic Routine
- deterministic Recommendations
- cart/checkout contracts
- legal gate remains fail-closed when required documents are unpublished
- notification delivery state
- audit/control records
- payment-provider webhook evidence shape

For payment systems, compare provider identifiers and Velora order/payment state without sending a live Production payment.

### L5 — RPO / RTO

Measure, do not guess.

RPO:
- record the chosen restore point;
- record the newest application/data timestamp present after restore;
- compute the observed gap.

RTO:
- start when restore execution begins;
- stop when the agreed smoke/reconciliation suite is green;
- preserve the measured duration and test conditions.

Any target RPO/RTO remains an Owner/business/infrastructure decision until explicitly approved.

### L6 — Vercel rollback

For a release rollback:
- record the failing Production deployment identity;
- record the intended previous Production deployment identity;
- verify the application/database compatibility of the target;
- execute rollback only under release authority;
- run controlled smoke checks;
- reconcile database/application state;
- record whether any forward-only migration or provider-side state requires a compensating action.

A Vercel platform rollback capability does not by itself prove Velora's rollback rehearsal.

## Existing Velora rollback evidence

Historical Sprint 2 rollback replay is documented in:
`docs/SPRINT_2_ROLLBACK_REPLAY_EVIDENCE_2026-09-19.md`

That evidence covers controlled transaction-wrapped SQL rollback replays in Restore-Test. It does not replace a Production backup/restore rehearsal and does not prove a Production rollback.

## Current Supabase / Vercel plan boundary

As of the current release review:
- Supabase organization plan is Free.
- Free-plan projects may be paused after a period of low activity.
- Paid Supabase plans provide daily database backups; PITR is a paid add-on for finer recovery granularity.
- Vercel deployment capacity/plan suitability must be verified separately before Production cutover.

These facts are platform capabilities, not Velora-specific evidence.

## Release Gate

Production infrastructure is eligible to move from OPEN/PENDING only after all of the following have concrete evidence:

- [ ] backup source and frequency
- [ ] retained backup artifact
- [ ] off-site copy
- [ ] restore rehearsal in non-Production
- [ ] schema/data verification after restore
- [ ] critical runtime smoke verification after restore
- [ ] measured RPO
- [ ] measured RTO
- [ ] Vercel rollback target identity
- [ ] rollback rehearsal/proof
- [ ] post-rollback reconciliation procedure
- [ ] Supabase capacity/plan decision
- [ ] Vercel capacity/plan decision
- [ ] monitoring/alerting baseline
- [ ] Owner/release authority recorded

## Current state

STATUS: OPEN / PENDING

What is evidenced now:
- Restore-Test is active and healthy.
- Existing rollback SQL replay evidence exists.
- Existing release blueprint/control tables exist.
- Production is frozen.

What is not evidenced now:
- verified Production backup inventory
- off-site Production backup copy
- non-Production restore of a current Production backup
- measured Production RPO/RTO
- Velora Production rollback rehearsal
- final capacity/plan decision

No Production mutation is authorized by this document.
