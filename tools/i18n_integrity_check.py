#!/usr/bin/env python3
import argparse, json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'src/locales/manifest.json'
RUNTIME=ROOT/'src/scripts/10-localization.js'

def runtime_locales():
    text=RUNTIME.read_text(encoding='utf-8')
    block=re.search(r'const LANGUAGE_META\s*=\s*\{(.*?)\n\s*\};',text,re.S)
    return re.findall(r'^\s*([a-z]{2})\s*:',block.group(1),re.M) if block else []

def main():
    p=argparse.ArgumentParser(description='Validate Velora i18n registry and runtime locale coverage')
    p.add_argument('--json',action='store_true',help='Emit JSON summary')
    p.add_argument('--strict',action='store_true',help='Fail when runtime registry is invalid')
    a=p.parse_args()
    m=json.loads(MANIFEST.read_text(encoding='utf-8'))
    declared=m.get('locales',[]); runtime=runtime_locales(); errors=[]
    if len(declared)!=12: errors.append(f'declared locale count={len(declared)} expected=12')
    if len(runtime)!=12: errors.append(f'runtime locale count={len(runtime)} expected=12')
    if sorted(declared)!=sorted(runtime): errors.append('declared/runtime locale registry mismatch')
    if 'ar' not in declared: errors.append('Arabic locale missing')
    report={'status':'FAIL' if errors else 'PASS','mode':m.get('source_mode','unknown'),'locales':len(declared),'runtime_locales':runtime,'namespaces':m.get('namespaces',[]),'fallback_measurement_status':'pending_structured_locale_source','fallback_debt':None,'errors':errors}
    print(json.dumps(report,ensure_ascii=False))
    if errors and a.strict: raise SystemExit(1)
    raise SystemExit(1 if errors else 0)
if __name__=='__main__':main()
