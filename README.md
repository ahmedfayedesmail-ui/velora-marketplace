# Velora Marketplace

This repository is the source-of-truth rebuild of the Velora Marketplace frontend.

## Current state
- RC9 is preserved unchanged under `legacy/`.
- The HTML has been separated into `src/index.html`, one consolidated stylesheet, and sequential classic JS files.
- Script execution order is preserved to minimize behavior drift during the migration.
- Secrets are not stored in source control.

## Master execution
Read `docs/MASTER_EXECUTION_PLAN.md` before continuing any platform work. It is the single continuous execution contract for audit, hardening, automation, governance, and readiness.

## Local preview
```bash
npm run serve
```
Then open `http://localhost:4173`.

## Migration rule
New work goes into the structured `src/` tree. Do not patch `legacy/`.

<!-- preview deployment trigger -->

<!-- audit-runtime-parity: admin-reentry-final-browser-evidence -->
