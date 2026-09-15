#!/usr/bin/env python3
import argparse,gzip,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; LOC=ROOT/'src/locales'
def main():
 p=argparse.ArgumentParser(description='Validate Velora locale keysets, registry and namespace gzip size')
 p.add_argument('--json',action='store_true',help='Emit JSON summary')
 p.add_argument('--strict',action='store_true',help='Fail when English fallbacks remain')
 a=p.parse_args(); m=json.loads((LOC/'manifest.json').read_text()); langs=m['locales']; nss=m['namespaces']; en={n:json.loads((LOC/'en'/f'{n}.json').read_text()) for n in nss}; errors=[]; fallback=0; sizes={}
 for l in langs:
  sizes[l]={}
  for n in nss:
   d=json.loads((LOC/l/f'{n}.json').read_text())
   if set(d)!=set(en[n]): errors.append(f'{l}/{n}: keyset mismatch')
   sizes[l][n]={'raw':len((LOC/l/f'{n}.json').read_bytes()),'gzip':len(gzip.compress((LOC/l/f'{n}.json').read_bytes(),mtime=0))}
   if sizes[l][n]['gzip']>30*1024: errors.append(f'{l}/{n}: gzip namespace >30KB')
   if l!='en': fallback+=sum(1 for k,v in en[n].items() if isinstance(v,str) and d.get(k)==v and v not in {'Velora','Blog','FAQ'})
 if a.strict and fallback: errors.append(f'strict fallback debt={fallback}')
 report={'status':'FAIL' if errors else 'PASS','locales':len(langs),'namespaces':len(nss),'fallback_debt':fallback,'errors':errors,'size_report':sizes}
 (ROOT/'docs'/'I18N_SIZE_REPORT.json').write_text(json.dumps(sizes,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False))
 raise SystemExit(1 if errors else 0)
if __name__=='__main__':main()
