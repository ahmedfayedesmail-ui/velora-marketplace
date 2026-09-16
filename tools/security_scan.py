#!/usr/bin/env python3
import argparse,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PATTERN_FILE=ROOT/'tools'/'secrets_patterns.yml'
TEXT_EXT={'.js','.html','.css','.json','.md','.mjs','.ts','.tsx','.py','.sh','.yml','.yaml','.toml','.txt','.sql'}
SKIP={'node_modules','.git','.venv','__pycache__','dist','build'}

def load_patterns():
    # Minimal YAML reader for the repository's simple pattern schema; no PyYAML dependency.
    text=PATTERN_FILE.read_text(encoding='utf-8')
    rows=[]; current=None
    for raw in text.splitlines():
        line=raw.strip()
        if not line or line.startswith('#'): continue
        if line.startswith('- name:'):
            if current: rows.append(current)
            current={'name':line.split(':',1)[1].strip()}
        elif ':' in line and current is not None:
            k,v=line.split(':',1); v=v.strip().strip("'\"")
            current[k.strip()]=v
    if current: rows.append(current)
    return [(r['name'], re.compile(r['regex'])) for r in rows]

def classify(name, file, context):
    if file == 'tools/secrets_patterns.yml' or file.endswith('.example'):
        return 'false_positive'
    if name == 'hardcoded_demo_credential':
        return 'needs_review'
    return 'real'

def main():
    p=argparse.ArgumentParser(description='Velora current-tree credential/secrets scan. Exit 0=clean, 1=real findings, 2=configuration/runtime error.')
    p.add_argument('--json',action='store_true',help='Emit JSON summary to stdout')
    p.add_argument('--context',type=int,default=10,help='Number of characters of redacted match context to include')
    a=p.parse_args()
    findings=[]
    try: patterns=load_patterns()
    except Exception as e:
        print(json.dumps({'status':'ERROR','error':str(e)})); return 2
    for f in ROOT.rglob('*'):
        if not f.is_file() or f.suffix.lower() not in TEXT_EXT or any(x in SKIP for x in f.parts) or f.name in {'SECURITY_SCAN.json','security_scan.py'}:
            continue
        try: text=f.read_text(encoding='utf-8',errors='ignore')
        except Exception: continue
        rel=str(f.relative_to(ROOT))
        for name,pat in patterns:
            for m in pat.finditer(text):
                line=text.count('\n',0,m.start())+1
                col=m.start()-(text.rfind('\n',0,m.start())+1)+1
                cls=classify(name,rel,text[max(0,m.start()-a.context):min(len(text),m.end()+a.context)])
                findings.append({'type':name,'file':rel,'line':line,'column':col,'classification':cls,'context':'[REDACTED]','match_length':len(m.group(0))})
    status='PASS' if not [x for x in findings if x['classification']=='real'] else 'FAIL'
    report={'status':status,'current_tree_findings':findings,'summary':{'total':len(findings),'real':sum(x['classification']=='real' for x in findings),'false_positive':sum(x['classification']=='false_positive' for x in findings),'needs_review':sum(x['classification']=='needs_review' for x in findings)},'git_history_scan_supported':(ROOT/'.git').exists(),'history_note':'Full-history verification is performed by CI Gitleaks with fetch-depth=0.'}
    (ROOT/'docs'/'SECURITY_SCAN.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))
    return 1 if status=='FAIL' else 0
if __name__=='__main__': raise SystemExit(main())
