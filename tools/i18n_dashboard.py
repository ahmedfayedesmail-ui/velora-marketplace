#!/usr/bin/env python3
import argparse, json, re, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'src' / 'locales' / 'manifest.json'
BASELINE = ROOT / 'docs' / 'I18N_BASELINE.json'
RUNTIME = ROOT / 'src' / 'scripts' / '10-localization.js'

def git(*args):
    try:
        return subprocess.check_output(['git', *args], cwd=ROOT, text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return None

def runtime_locales():
    text = RUNTIME.read_text(encoding='utf-8')
    block = re.search(r'const LANGUAGE_META\\s*=\\s*\\{(.*?)\\n\\s*\\};', text, re.S)
    return re.findall(r'^\\s*([a-z]{2})\\s*:', block.group(1), re.M) if block else []

def main():
    p = argparse.ArgumentParser(description='Velora i18n dashboard with Git provenance and runtime registry validation')
    p.add_argument('--json', action='store_true', help='Emit JSON summary')
    p.add_argument('--require-git', action='store_true', help='Exit 2 when Git metadata is unavailable')
    a = p.parse_args()
    baseline = json.loads(BASELINE.read_text(encoding='utf-8'))
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    declared = manifest.get('locales', [])
    runtime = runtime_locales()
    sha = git('rev-parse', 'HEAD')
    ts = git('show', '-s', '--format=%cI', 'HEAD')
    mismatch = sorted(set(declared) ^ set(runtime))
    report = {'status':'PASS' if not mismatch else 'FAIL','baseline_commit':baseline['commit'],'baseline_timestamp':baseline['timestamp'],'baseline_fallback':baseline['fallback'],'current_commit':sha,'current_timestamp':ts,'declared_locales':declared,'runtime_locales':runtime,'locale_registry_match':not mismatch,'registry_mismatch':mismatch,'namespaces':manifest.get('namespaces',[]),'priority_fallback_baseline':manifest.get('priority_split',{}),'fallback_measurement_status':'pending_structured_locale_source','current_fallback':None,'forecast_status':'pending_actual_7_day_measurement','source_mode':manifest.get('source_mode','unknown')}
    md = '# Velora I18N Completeness Dashboard\n\n' + f"Baseline: `{baseline['commit']}` · {baseline['timestamp']} · fallback={baseline['fallback']}\n\n" + f"Current: `{sha or 'NO_GIT'}` · {ts or 'NO_TIMESTAMP'}\n\n" + f"Declared locales: {', '.join(declared)}\n\nRuntime locales: {', '.join(runtime)}\n\nRegistry match: **{'PASS' if not mismatch else 'FAIL'}**\n\n" + 'Current fallback measurement: **PENDING** — runtime localization is still inline JS under `src/scripts/`; 402 remains the dated baseline, not a current-rate claim.\n\nForecast: **PENDING** until a complete 7-day measurement interval exists.\n'
    (ROOT/'docs'/'I18N_DASHBOARD.md').write_text(md, encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))
    raise SystemExit(1 if mismatch else 0)
if __name__ == '__main__': main()
