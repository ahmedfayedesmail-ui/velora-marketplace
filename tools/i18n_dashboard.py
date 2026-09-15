#!/usr/bin/env python3
import argparse, json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
LOCALES=ROOT/'src/locales'; BASELINE=ROOT/'docs/I18N_BASELINE.json'; PROTECTED={'Velora','Blog','FAQ'}
def git(*args):
    try:return subprocess.check_output(['git',*args],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()
    except:return None
def main():
    p=argparse.ArgumentParser(description='Velora i18n dashboard with Git provenance')
    p.add_argument('--json',action='store_true',help='Emit one JSON object')
    p.add_argument('--require-git',action='store_true',help='Exit 2 when Git metadata is unavailable')
    a=p.parse_args(); b=json.loads(BASELINE.read_text()); m=json.loads((LOCALES/'manifest.json').read_text()); langs=m['locales']; nss=m['namespaces']; en={n:json.loads((LOCALES/'en'/f'{n}.json').read_text()) for n in nss}
    by_locale={}; by_ns={n:0 for n in nss}
    for l in langs:
        if l=='en':continue
        c=0
        for n in nss:
            d=json.loads((LOCALES/l/f'{n}.json').read_text())
            for k,v in en[n].items():
                if isinstance(v,str) and d.get(k)==v and v not in PROTECTED:c+=1; by_ns[n]+=1
        by_locale[l]=c
    cur=sum(by_locale.values()); sha=git('rev-parse','HEAD'); ts=git('show','-s','--format=%cI','HEAD')
    if a.require_git and not sha: raise SystemExit(2)
    policy={'commerce':'P1','navigation':'P2','common':'P2','discovery':'P3','seller':'P3','support':'P4'}
    if (ROOT/'docs/I18N_PRIORITY_POLICY.json').exists():policy=json.loads((ROOT/'docs/I18N_PRIORITY_POLICY.json').read_text()).get('namespacePriority',policy)
    pri={p:0 for p in ['P1','P2','P3','P4','P5']}
    for n,c in by_ns.items():pri[policy.get(n,'P3')]+=c
    report={'baseline_commit':b['commit'],'baseline_timestamp':b['timestamp'],'baseline_fallback':b['fallback'],'current_commit':sha,'current_timestamp':ts,'current_fallback':cur,'fallback_delta_from_baseline':b['fallback']-cur,'priority_fallback':pri,'locale_fallback':by_locale,'namespace_fallback':by_ns}
    md=['# Velora I18N Completeness Dashboard','',f"Baseline snapshot: `{b['commit']}` · {b['timestamp']} · fallback={b['fallback']}",f"Current snapshot: `{sha or 'NO_GIT'}` · {ts or 'NO_TIMESTAMP'} · fallback={cur}",'','| Locale | Fallback debt |','|---|---:|']+[f'| `{l}` | {c} |' for l,c in sorted(by_locale.items())]+['','## Priority debt','| Priority | Count |','|---|---:|']+[f'| {p} | {pri[p]} |' for p in ['P1','P2','P3','P4','P5']]
    (ROOT/'docs/I18N_DASHBOARD.md').write_text('\n'.join(md)+'\n')
    print(json.dumps(report,ensure_ascii=False))
    print(f"I18N_DASHBOARD_OK baseline={b['commit']} baseline_ts={b['timestamp']} fallback={b['fallback']} current={cur} commit={sha or 'NO_GIT'} timestamp={ts or 'NO_TIMESTAMP'}")
if __name__=='__main__':main()
