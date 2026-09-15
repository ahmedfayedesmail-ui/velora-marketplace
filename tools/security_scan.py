#!/usr/bin/env python3
import argparse,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
TEXT_EXT={'.js','.html','.css','.json','.md','.mjs','.ts','.tsx','.py','.sh','.yml','.yaml','.toml','.txt','.sql'}
SKIP={'node_modules','.git','.venv','__pycache__'}
PATTERNS=[
('private_key',re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----')),
('supabase_service_role',re.compile(r'(?i)(?:service[_-]?role)["\']?\s*[:=]\s*["\'][^"\']{16,}["\']')),
('password_literal',re.compile(r'(?i)\bpassword\s*[:=]\s*["\'][^"\']{8,}["\']')),
('stripe_live_key',re.compile(r'\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b')),
('sendgrid_key',re.compile(r'\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b')),
('jwt_like_literal',re.compile(r'(?<![A-Za-z0-9_-])eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}(?![A-Za-z0-9_-])')),
('api_key_assignment',re.compile(r'(?i)\b(?:api[_-]?key|client[_-]?secret|secret[_-]?key)\s*[:=]\s*["\'][^"\']{12,}["\']')),
('hardcoded_demo_credential',re.compile(r'(?:Maha@Owner2026|Maha@Admin2026|owner@maha\.com|admin@maha\.com)')),
]
def main():
 p=argparse.ArgumentParser(description='Velora current-tree credential/secrets scan')
 p.add_argument('--json',action='store_true',help='Emit JSON summary')
 a=p.parse_args(); findings=[]
 for f in ROOT.rglob('*'):
  if not f.is_file() or f.suffix.lower() not in TEXT_EXT or any(x in SKIP for x in f.parts) or f.name=='SECURITY_SCAN.json': continue
  try:t=f.read_text(encoding='utf-8',errors='ignore')
  except Exception:continue
  for name,pat in PATTERNS:
   for m in pat.finditer(t): findings.append({'type':name,'file':str(f.relative_to(ROOT)),'line':t.count('\n',0,m.start())+1})
 report={'status':'PASS' if not findings else 'FAIL','current_tree_findings':findings,'git_history_scan_supported':(ROOT/'.git').exists(),'git_history_findings':[],'history_note':'Full-history verification is performed by CI Gitleaks with fetch-depth=0.'}
 (ROOT/'docs'/'SECURITY_SCAN.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'status':report['status'],'current_tree_findings':len(findings),'git_history_scan_supported':report['git_history_scan_supported']},ensure_ascii=False))
 raise SystemExit(1 if findings else 0)
if __name__=='__main__':main()
