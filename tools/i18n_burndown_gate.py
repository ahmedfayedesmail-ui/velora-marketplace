#!/usr/bin/env python3
import argparse, json, subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; LOC=ROOT/'src/locales'; BASE=ROOT/'docs/I18N_BASELINE.json'; CFG=ROOT/'docs/I18N_BURN_DOWN.json'; PROTECTED={'Velora','Blog','FAQ'}
def git(*args):
    try:return subprocess.check_output(['git',*args],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()
    except:return None
def current_counts():
    m=json.loads((LOC/'manifest.json').read_text()); langs=[x for x in m['locales'] if x!='en']; nss=m['namespaces']; en={n:json.loads((LOC/'en'/f'{n}.json').read_text()) for n in nss}; byns={n:0 for n in nss}
    for l in langs:
        for n in nss:
            d=json.loads((LOC/l/f'{n}.json').read_text())
            byns[n]+=sum(1 for k,v in en[n].items() if isinstance(v,str) and d.get(k)==v and v not in PROTECTED)
    policy=json.loads((ROOT/'docs/I18N_PRIORITY_POLICY.json').read_text()).get('namespacePriority',{})
    pri={p:0 for p in ['P1','P2','P3','P4','P5']}
    for n,c in byns.items():pri[policy.get(n,'P3')]+=c
    return sum(byns.values()),pri

def main():
    p=argparse.ArgumentParser(description='Velora i18n cumulative burn-down gate with anti-gaming net snapshots')
    p.add_argument('--json',action='store_true',help='Emit one JSON object')
    p.add_argument('--require-history',action='store_true',help='Exit 2 until a dated 7-day interval exists')
    a=p.parse_args(); b=json.loads(BASE.read_text()); c=json.loads(CFG.read_text()); cur,pri=current_counts(); sha=git('rev-parse','HEAD'); now=datetime.now(timezone.utc); start=datetime.fromisoformat(b['timestamp'].replace('Z','+00:00')); elapsed=max(0,(now-start).days); weeks=elapsed//7; target=int(c.get('weeklyTarget',50)); required=max(0,int(b['fallback'])-target*weeks)
    actual_rate=None if weeks<1 else round((int(b['fallback'])-cur)/(elapsed/7),2) if elapsed else None
    scenario=c.get('scenario',{})
    report={'baseline_fallback':b['fallback'],'current_fallback':cur,'net_reduction':b['fallback']-cur,'weeks_elapsed':weeks,'required_max':required,'weekly_target':target,'actual_rate_fallbacks_per_week':actual_rate,'priority_fallback':pri,'current_commit':sha,'anti_gaming':'gate uses net snapshot state; additions followed by removals do not count as progress','gate_status':'PASS' if weeks<1 or cur<=required else 'FAIL','forecast_status':'actual-rate-ready' if actual_rate is not None else 'pending_actual_rate','scenario_forecast':scenario}
    print(json.dumps(report,ensure_ascii=False))
    if a.require_history and weeks<1: raise SystemExit(2)
    if weeks>=1 and cur>required: raise SystemExit(1)
if __name__=='__main__':main()
