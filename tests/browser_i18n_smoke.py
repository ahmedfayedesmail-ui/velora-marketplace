#!/usr/bin/env python3
import subprocess,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
PORT=4184
LANGS=['en','es','ar','fr','de','it','pt','tr','zh','ja','ko','hi']
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'-d',str(ROOT)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(.5)
try:
    with sync_playwright() as p:
        b=p.chromium.launch(headless=True)
        page=b.new_page(viewport={'width':1440,'height':1000})
        for lang in LANGS:
            page.goto(f'http://127.0.0.1:{PORT}/tests/i18n-fixture.html?lang={lang}',wait_until='domcontentloaded')
            expected='rtl' if lang=='ar' else 'ltr'
            got=(page.locator('html').get_attribute('lang'),page.locator('html').get_attribute('dir'))
            if got!=(lang,expected): raise AssertionError(f'LANG_DIR_FAIL:{lang}:{got}')
        page.goto(f'http://127.0.0.1:{PORT}/tests/i18n-fixture.html?lang=en')
        page.screenshot(path=str(ROOT/'docs'/'I18N_SCREENSHOT_EN.png'),full_page=True)
        page.goto(f'http://127.0.0.1:{PORT}/tests/i18n-fixture.html?lang=ar')
        page.screenshot(path=str(ROOT/'docs'/'I18N_SCREENSHOT_AR.png'),full_page=True)
        if page.locator('body').evaluate('(e)=>getComputedStyle(e).direction')!='rtl': raise AssertionError('RTL_CSS_FAIL')
        b.close()
    print('BROWSER_I18N_SMOKE_PASS languages=12 rtl=ar screenshots=2')
finally:
    srv.terminate(); srv.wait(timeout=3)
