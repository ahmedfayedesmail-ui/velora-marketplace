from pathlib import Path
import re, json
root=Path(__file__).resolve().parents[1]
html=(root/'src/index.html').read_text(errors='ignore')
css=(root/'src/styles/velora.css').read_text(errors='ignore')
js_files=sorted((root/'src/scripts').glob('*.js'))
js='\n'.join(p.read_text(errors='ignore') for p in js_files)
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
}
(root/'docs'/'STATIC_AUDIT.json').write_text(json.dumps(checks,indent=2)+"\n")
print(json.dumps(checks,indent=2))
