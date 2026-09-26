from pathlib import Path
import re, json
root=Path(__file__).resolve().parents[1]
html=(root/'src/index.html').read_text(errors='ignore')
css=(root/'src/styles/velora.css').read_text(errors='ignore')
js_files=sorted((root/'src/scripts').glob('*.js'))
js='\n'.join(p.read_text(errors='ignore') for p in js_files)
# Customer-facing static contract checks.
i18n_keys=[]
for key in re.findall(r'data-velora-i18n="([^"]+)"', html, re.I):
    i18n_keys.append(key.replace('&amp;', '&').strip())

loc=(root/'src/scripts/51-localization.js').read_text(errors='ignore')
core_start=loc.find('const CORE_AR={')
core_end=loc.find('\n};', core_start)
core_block=loc[core_start:core_end] if core_start >= 0 and core_end > core_start else ''
core_ar_keys=set(re.findall(r"(?m)^\s*'((?:[^'\\]|\\.)*)'\s*:", core_block))
missing_i18n=sorted(set(i18n_keys)-{k.replace("\\'", "'") for k in core_ar_keys})

forbidden_customer_terms=['electronics','fashion','home & kitchen','sports & outdoors','home & living']
forbidden_hits=[]
for term in forbidden_customer_terms:
    if term.lower() in html.lower():
        forbidden_hits.append(term)

checks={
 'html_chars':len(html),
 'html_lines':html.count('\n')+1,
 'css_chars':len(css),
 'js_files':len(js_files),
 'js_chars':len(js),
 'external_scripts':len(re.findall(r'<script[^>]+src=',html,re.I)),
 'inline_script_tags_remaining':len(re.findall(r'<script(?![^>]+src=)[^>]*>.*?</script>',html,re.I|re.S)),
 'style_tags_remaining':len(re.findall(r'<style\b',html,re.I)),
 'source_map_urls':len(re.findall(r'//# sourceMappingURL=',js)),
 'hardcoded_supabase_urls':len(re.findall(r'https://[A-Za-z0-9.-]+\.supabase\.co',js,re.I)),
 'secret_like_assignments':len(re.findall(r'(?i)(service_role|secret[_-]?key|private[_-]?key)\s*[:=]\s*[\'\"]',js)),
 'paymob_literals':len(re.findall(r'paymob',js,re.I)),
 'i18n_literals':len(re.findall(r'i18n|translation|locale',js,re.I)),
 'i18n_data_attributes':len(set(i18n_keys)),
 'i18n_missing_ar':missing_i18n,
 'forbidden_customer_category_hits':forbidden_hits,
}
if checks['i18n_missing_ar']:
    raise SystemExit('I18N_MISSING_AR_KEYS')
if checks['forbidden_customer_category_hits']:
    raise SystemExit('GENERIC_CATEGORY_LEAKAGE')
(root/'docs'/'STATIC_AUDIT.json').write_text(json.dumps(checks,indent=2)+"\n")
print(json.dumps(checks,indent=2))
