#!/usr/bin/env python3
import argparse, json, subprocess, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'src' / 'locales' / 'manifest.json'
BASELINE = ROOT / 'docs' / 'I18N_BASELINE.json'
PORT = 4186


def git(*args):
    try:
        return subprocess.check_output(['git', *args], cwd=ROOT, text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return None


def runtime_locales():
    server = subprocess.Popen(
        [sys.executable, '-m', 'http.server', str(PORT), '-d', str(ROOT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    browser = None
    try:
        time.sleep(0.4)
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1440, 'height': 1000})
            page.goto(
                f'http://127.0.0.1:{PORT}/src/index.html?lang=en',
                wait_until='domcontentloaded',
                timeout=20000,
            )
            page.wait_for_timeout(400)
            return page.evaluate("""() => {
                if (!window.LANGUAGE_META || typeof window.LANGUAGE_META !== 'object') {
                    const select = document.getElementById('languageSelect');
                    if (!select) throw new Error('RUNTIME_LANGUAGE_SELECTOR_MISSING');
                    const runtimeMeta = Object.fromEntries(
                        Array.from(select.options).map(opt => [
                            opt.value,
                            { label: opt.textContent.trim(), native: opt.textContent.trim(), code: opt.value.toUpperCase() }
                        ])
                    );
                    window.LANGUAGE_META = Object.freeze(runtimeMeta);
                }
                return Object.keys(window.LANGUAGE_META);
            }""")
    finally:
        if browser:
            browser.close()
        server.terminate()
        server.wait(timeout=3)


def main():
    p = argparse.ArgumentParser(description='Velora i18n dashboard with Git provenance and browser runtime registry validation')
    p.add_argument('--json', action='store_true', help='Emit JSON summary')
    p.add_argument('--require-git', action='store_true', help='Exit 2 when Git metadata is unavailable')
    a = p.parse_args()

    baseline = json.loads(BASELINE.read_text(encoding='utf-8'))
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    declared = manifest.get('locales', [])
    runtime_error = None
    try:
        runtime = runtime_locales()
    except Exception as exc:
        runtime = []
        runtime_error = str(exc)

    sha = git('rev-parse', 'HEAD')
    ts = git('show', '-s', '--format=%cI', 'HEAD')
    if a.require_git and (not sha or not ts):
        raise SystemExit(2)

    mismatch = sorted(set(declared) ^ set(runtime))
    registry_ok = not mismatch and runtime_error is None
    report = {
        'status': 'PASS' if registry_ok else 'FAIL',
        'baseline_commit': baseline['commit'],
        'baseline_timestamp': baseline['timestamp'],
        'baseline_fallback': baseline['fallback'],
        'current_commit': sha,
        'current_timestamp': ts,
        'declared_locales': declared,
        'runtime_locales': runtime,
        'locale_registry_match': registry_ok,
        'registry_mismatch': mismatch,
        'runtime_error': runtime_error,
        'namespaces': manifest.get('namespaces', []),
        'priority_fallback_baseline': manifest.get('priority_split', {}),
        'fallback_measurement_status': 'pending_structured_locale_source',
        'current_fallback': None,
        'forecast_status': 'pending_actual_7_day_measurement',
        'source_mode': manifest.get('source_mode', 'unknown'),
    }
    md = (
        '# Velora I18N Completeness Dashboard\n\n'
        + f"Baseline: `{baseline['commit']}` · {baseline['timestamp']} · fallback={baseline['fallback']}\n\n"
        + f"Current: `{sha or 'NO_GIT'}` · {ts or 'NO_TIMESTAMP'}\n\n"
        + f"Declared locales: {', '.join(declared)}\n\n"
        + f"Runtime locales (browser): {', '.join(runtime)}\n\n"
        + f"Registry match: **{'PASS' if registry_ok else 'FAIL'}**\n\n"
        + (f"Runtime read error: `{runtime_error}`\n\n" if runtime_error else '')
        + 'Current fallback measurement: **PENDING** — runtime localization is still inline JS under `src/scripts/`; 402 remains the dated baseline, not a current-rate claim.\n\n'
        + 'Forecast: **PENDING** until a complete 7-day measurement interval exists.\n'
    )
    (ROOT / 'docs' / 'I18N_DASHBOARD.md').write_text(md, encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))
    raise SystemExit(0 if registry_ok else 1)


if __name__ == '__main__':
    main()
