#!/usr/bin/env python3
import subprocess,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
PORT=4185
LANGS=['en','es','ar','fr','de','it','pt','tr','zh','ja','ko','hi']
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'-d',str(ROOT)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(.5)
try:
    with sync_playwright() as p:
        b=p.chromium.launch(headless=True)
        page=b.new_page(viewport={'width':1440,'height':1000})
        for lang in LANGS:
            page.goto(f'http://127.0.0.1:{PORT}/src/index.html?lang={lang}',wait_until='domcontentloaded',timeout=20000)
            page.wait_for_timeout(500)
            if page.locator('html').get_attribute('lang')!=lang: raise AssertionError(f'LANG_FAIL:{lang}')
            expected='rtl' if lang=='ar' else 'ltr'
            if page.locator('html').get_attribute('dir')!=expected: raise AssertionError(f'DIR_FAIL:{lang}')
            if page.locator('title').count()==0: raise AssertionError(f'TITLE_MISSING:{lang}')
            if page.locator('meta[name="description"]').count()==0: raise AssertionError(f'META_DESCRIPTION_MISSING:{lang}')
        page.goto(f'http://127.0.0.1:{PORT}/src/index.html?lang=en',wait_until='domcontentloaded',timeout=20000)
        page.wait_for_timeout(400)
        page.screenshot(path=str(ROOT/'docs'/'I18N_ACCEPTANCE_LTR.png'),full_page=True)
        page.goto(f'http://127.0.0.1:{PORT}/src/index.html?lang=ar',wait_until='domcontentloaded',timeout=20000)
        page.wait_for_timeout(400)
        page.screenshot(path=str(ROOT/'docs'/'I18N_ACCEPTANCE_RTL.png'),full_page=True)
        b.close()
    print('BROWSER_I18N_ACCEPTANCE_PASS languages=12 rtl=ar screenshots=2')
finally:
    srv.terminate(); srv.wait(timeout=3)
