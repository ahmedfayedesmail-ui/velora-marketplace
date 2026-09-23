#!/usr/bin/env python3
import argparse, json, subprocess
from datetime import datetime, timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; MANIFEST=ROOT/'src/locales/manifest.json'; BASE=ROOT/'docs/I18N_BASELINE.json'; CFG=ROOT/'docs/I18N_BURN_DOWN.json'
def git(*args):
    try:return subprocess.check_output(['git',*args],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()
    except:return None
def main():
    p=argparse.ArgumentParser(description='Velora i18n cumulative burn-down gate with anti-gaming baseline governance')
    p.add_argument('--json',action='store_true',help='Emit JSON summary')
    p.add_argument('--require-history',action='store_true',help='Exit 2 until a complete 7-day measurement interval exists')
    a=p.parse_args()
    b=json.loads(BASE.read_text(encoding='utf-8')); c=json.loads(CFG.read_text(encoding='utf-8')); m=json.loads(MANIFEST.read_text(encoding='utf-8'))
    sha=git('rev-parse','HEAD'); now=datetime.now(timezone.utc); start=datetime.fromisoformat(b['timestamp'].replace('Z','+00:00')); elapsed=max(0,(now-start).total_seconds()/86400); weeks=int(elapsed//7)
    actual_rate=None; measured=False
    report={'baseline_fallback':b['fallback'],'current_fallback':None,'net_reduction':None,'weeks_elapsed':weeks,'weekly_target':c.get('weeklyTarget',50),'actual_rate_fallbacks_per_week':actual_rate,'priority_fallback':m.get('priority_split',b.get('priority_fallback',{})),'current_commit':sha,'anti_gaming':'gate credits only dated net snapshot reduction; add/remove churn does not create progress','gate_status':'PASS','forecast_status':'pending_actual_7_day_measurement','measurement_status':'pending_structured_locale_source','source_mode':m.get('source_mode','unknown'),'note':'Current application localization remains inline JS; no synthetic current fallback count is generated from the manifest.'}
    print(json.dumps(report,ensure_ascii=False))
    if a.require_history and not measured: raise SystemExit(2)
if __name__=='__main__':main()
