# Velora Quality Tools

Run from repository root. Every tool supports `--help`. Machine-oriented tools support `--json`. Exit code `0` means pass/completed, `1` means a detected quality/security failure, and `2` means the requested historical prerequisite is not yet available.

| Tool | Command |
|---|---|
| I18N dashboard | `python3 tools/i18n_dashboard.py --json` |
| I18N burn-down gate | `python3 tools/i18n_burndown_gate.py --json` |
| I18N integrity | `python3 tools/i18n_integrity_check.py --json` |
| Security scan | `python3 tools/security_scan.py --json` |
| Static audit | `python3 tools/static_audit.py --json` |
| Browser smoke | `python3 tests/browser_i18n_smoke.py` |
| Browser acceptance | `python3 tests/browser_i18n_acceptance.py` |

The RC2 dashboard output includes baseline commit + timestamp and current Git commit + timestamp on the same status line. The burn-down gate treats the first seven days as a measurement period and explicitly refuses to invent an actual rate before a complete interval exists. Its planning scenario uses the current priority split P1=47, P2=196, P3=126, P4=33.

CI runs the tools on pull requests targeting `velora-baseline`, performs a full-history Gitleaks scan, installs Chromium with `playwright install --with-deps chromium`, runs all 12 locales with Arabic RTL coverage, and uploads browser screenshots as artifacts.
