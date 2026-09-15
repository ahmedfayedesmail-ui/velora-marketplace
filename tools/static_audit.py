#!/usr/bin/env python3
import argparse,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    p=argparse.ArgumentParser(description='Audit Velora static source for inline code and secret-like assignments')
    p.add_argument('--json',action='store_true',help='Emit JSON summary')
    args=p.parse_args()
    html=(ROOT/'src/index.html').read_text(errors='ignore'); css=(ROOT/'src/styles/velora.css').read_text(errors='ignore') if (ROOT/'src/styles/velora.css').exists() else ''
    js_files=sorted((ROOT/'src/scripts').glob('*.js')) if (ROOT/'src/scripts').exists() else []; js='\n'.join(x.read_text(errors='ignore') for x in js_files)
    checks={'html_chars':len(html),'html_lines':html.count('\n')+1,'css_chars':len(css),'js_files':len(js_files),'js_chars':len(js),'external_scripts':len(re.findall(r'<script[^>]+src=',html,re.I)),'inline_script_tags_remaining':len(re.findall(r'<script(?![^>]+src=)[^>]*>.*?</script>',html,re.I|re.S)),'style_tags_remaining':len(re.findall(r'<style\\b',html,re.I)),'source_map_urls':len(re.findall(r'//# sourceMappingURL=',js)),'hardcoded_supabase_urls':len(re.findall(r'https://[A-Za-z0-9.-]+\\.supabase\\.co',js,re.I)),'secret_like_assignments':len(re.findall(r'(?i)(service_role|secret[_-]?key|private[_-]?key)\\s*[:=]\\s*[\"\']',js)),'paymob_literals':len(re.findall(r'paymob',js,re.I)),'i18n_literals':len(re.findall(r'i18n|translation|locale',js,re.I))}
    (ROOT/'docs'/'STATIC_AUDIT.json').write_text(json.dumps(checks,indent=2)+'\n'); print(json.dumps(checks,ensure_ascii=False))
if __name__=='__main__':main()
