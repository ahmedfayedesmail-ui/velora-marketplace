/* ================================================================
   VELORA GLOBAL LOCALE & COMMERCE CONTEXT — STAGE 59
   ----------------------------------------------------------------
   One persistent context for language + country + currency + timezone.
   The UI stays compatible with the existing I18N layer, while user
   preferences are persisted server-side through Supabase.
   ================================================================ */
(() => {
  'use strict';
  const LANG_META = (window.VELORA_CORE && window.VELORA_CORE.languages) || {};
  const CURRENCIES = window.VELORA_CURRENCY_META || {};
  const initialCountry = (localStorage.getItem('velora_country') || 'EG').toUpperCase();
  const rawStoredLanguage = (localStorage.getItem('velora_language') || 'en').toLowerCase();
  const storedLanguage = ['en','ar'].includes(rawStoredLanguage) ? rawStoredLanguage : 'en';
  const storedCurrency = (localStorage.getItem('velora_currency') || '').toUpperCase();
  const initialCurrency = initialCountry === 'EG' ? 'EGP' : (storedCurrency || 'USD');
  // Canonical global-locale helpers are defined below; all persisted locale state is normalized through them.
  function canonicalLocale(value){
    value=String(value||'').toLowerCase();
    return value==='ar'?'ar':'en';
  }
  function canonicalCountry(value){
    value=String(value||'').trim().toUpperCase();
    return /^[A-Z]{2}$/.test(value)?value:'EG';
  }
  function canonicalCurrency(value,country){
    value=String(value||'').trim().toUpperCase();
    if(CURRENCIES[value]) return value;
    return country==='EG'?'EGP':'USD';
  }
  function canonicalDateLocale(locale,country){
    return canonicalLocale(locale)+'-'+canonicalCountry(country);
  }
  function normalizeState(){
    state.locale=canonicalLocale(state.locale);
    state.country_code=canonicalCountry(state.country_code);
    state.currency_code=canonicalCurrency(state.currency_code,state.country_code);
    state.timezone=String(state.timezone||'UTC')||'UTC';
    state.date_locale=canonicalDateLocale(state.locale,state.country_code);
    return state;
  }
  function persistState(){
    localStorage.setItem('velora_language',state.locale);
    localStorage.setItem('velora_country',state.country_code);
    localStorage.setItem('velora_currency',state.currency_code);
    localStorage.setItem('velora_date_locale',state.date_locale);
  }
  function syncLocaleUi(){
    normalizeState();
    VELORA_CURRENCY=state.currency_code;
    const currencySelect=document.getElementById('currencySelect');
    if(currencySelect) currencySelect.value=state.currency_code;
    const languageSelect=document.getElementById('languageSelect');
    if(languageSelect) languageSelect.value=state.locale;
    document.documentElement.lang=state.locale;
    document.documentElement.dir=LANG_META[state.locale]?.dir||(state.locale==='ar'?'rtl':'ltr');
    window.VELORA_GLOBAL_LOCALE=state.locale;
    if(window.VELORA_MARKET_CONTEXT){
      window.VELORA_MARKET_CONTEXT.countryCode=state.country_code;
      window.VELORA_MARKET_CONTEXT.currencyCode=state.currency_code;
      window.VELORA_MARKET_CONTEXT.languageCode=state.locale;
    }
    try{ if(typeof updateCurrencyDisplay==='function') updateCurrencyDisplay(); }catch(_){}
    persistState();
  }
  const state = window.VELORA_GLOBAL_LOCALE_STATE = window.VELORA_GLOBAL_LOCALE_STATE || {
    locale: storedLanguage,
    country_code: initialCountry,
    currency_code: initialCurrency,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    date_locale: localStorage.getItem('velora_date_locale') || (navigator.language || 'en-US')
  };

  const db = () => window.mahaSupabase || window.supabaseClient || window.sb || null;
  const esc = (v) => typeof escapeHtml === 'function' ? escapeHtml(String(v ?? '')) : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function loadContext() {
    try {
      const c = db();
      normalizeState();
      if (!c?.rpc || !STATE?.user) {
        syncLocaleUi();
        return state;
      }
      const r = await c.rpc('velora_get_global_locale_context');
      if (r?.error || !r?.data) {
        syncLocaleUi();
        return state;
      }
      Object.assign(state, r.data);
      normalizeState();
      syncLocaleUi();
      if (window.VELORA_GLOBAL_LOCALE !== state.locale &&
          typeof window.setVeloraLanguage === 'function') {
        await window.setVeloraLanguage(state.locale);
      } else if (typeof window.VELORA_I18N_RENDER === 'function') {
        window.VELORA_I18N_RENDER(document);
      }
      syncLocaleUi();
    } catch (_) {
      normalizeState();
      syncLocaleUi();
    }
    return state;
  }

  const previousSetLanguage = window.setVeloraLanguage;
  window.setVeloraLanguage = async function(code) {
    code = canonicalLocale(code);
    if (!LANG_META[code]) return false;
    const ok = typeof previousSetLanguage === 'function' ? await previousSetLanguage(code) : true;
    if (!ok) return false;
    state.locale = code;
    state.date_locale = canonicalDateLocale(state.locale,state.country_code);
    syncLocaleUi();
    try {
      const c = db();
      if (c?.rpc && STATE?.user) {
        await c.rpc('velora_set_global_locale_context', {
          p_locale: code,
          p_country_code: state.country_code || null,
          p_currency_code: state.currency_code || null,
          p_timezone: state.timezone || null,
          p_date_locale: state.date_locale || null
        });
      }
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('velora:global-locale-change', {detail:{...state}}));
    return true;
  };

  const previousSetCurrency = window.setVeloraCurrency;
  window.setVeloraCurrency = async function(code) {
    code=String(code||'').toUpperCase();
    if (!CURRENCIES[code]) return false;
    const ok = typeof previousSetCurrency === 'function' ? previousSetCurrency(code) : true;
    if (!ok) return false;
    state.currency_code = code;
    normalizeState();
    syncLocaleUi();
    try {
      const c = db();
      if (c?.rpc && STATE?.user) {
        await c.rpc('velora_set_global_locale_context', {
          p_locale: state.locale || 'en',
          p_country_code: state.country_code || null,
          p_currency_code: state.currency_code,
          p_timezone: state.timezone || null,
          p_date_locale: state.date_locale || null
        });
      }
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('velora:global-currency-change', {detail:{...state}}));
    return true;
  };

  async function savePreferences(e) {
    e.preventDefault();
    const locale = ['en','ar'].includes(document.getElementById('vlpLanguage')?.value || state.locale)
      ? (document.getElementById('vlpLanguage')?.value || state.locale)
      : 'en';
    const country = (document.getElementById('vlpCountry')?.value || state.country_code).trim().toUpperCase();
    const currency = document.getElementById('vlpCurrency')?.value || state.currency_code;
    const timezone = document.getElementById('vlpTimezone')?.value || state.timezone;
    const dateLocale = canonicalDateLocale(locale,country);
    try {
      const c = db();
      if (!c?.rpc || !STATE?.user) throw new Error('Please login first');
      const r = await c.rpc('velora_set_global_locale_context', {
        p_locale: locale,
        p_country_code: country || null,
        p_currency_code: currency,
        p_timezone: timezone,
        p_date_locale: dateLocale
      });
      if (r?.error) throw r.error;
      Object.assign(state, r.data || {}, {
        locale:canonicalLocale(locale),
        country_code:canonicalCountry(country),
        currency_code:canonicalCurrency(currency,canonicalCountry(country)),
        timezone,
        date_locale:canonicalDateLocale(locale,country)
      });
      normalizeState();
      persistState();
      if (typeof window.setVeloraLanguage === 'function') await window.setVeloraLanguage(locale);
      if (CURRENCIES[currency]) VELORA_CURRENCY = currency;
      if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
      renderGlobalPreferences();
      showToast(typeof trSrc === 'function' && trSrc('Preferences saved','en') !== null ? trSrc('Preferences saved', locale) : 'Preferences saved','success');
    } catch (err) {
      showToast(`⚠️ ${err?.message || 'Could not save preferences'}`, 'error');
    }
  }

  function renderGlobalPreferences() {
    const host = document.getElementById('veloraGlobalPreferences');
    if (!host) return;
    const languages = ['en','ar'].filter(k => LANG_META[k]).map(k => `<option value="${k}" ${k===state.locale?'selected':''}>${esc(LANG_META[k].name || k)}</option>`).join('');
    const currencies = Object.keys(CURRENCIES).map(k => `<option value="${k}" ${k===state.currency_code?'selected':''}>${k} — ${esc(CURRENCIES[k].symbol || '')}</option>`).join('');
    host.innerHTML = `
      <div class="form-section" style="margin-top:1.25rem;border:1px solid rgba(255,255,255,.08);">
        <h3>🌍 Global Preferences</h3>
        <p style="color:var(--text-muted);margin:.35rem 0 1rem">Language, country, currency, timezone and regional formatting are saved to your Velora account.</p>
        <form onsubmit="window.VELORA_SAVE_GLOBAL_PREFERENCES(event)">
          <div class="form-row">
            <div class="form-group"><label>Language</label><select id="vlpLanguage" class="form-input">${languages}</select></div>
            <div class="form-group"><label>Country / Region</label><input id="vlpCountry" class="form-input" maxlength="2" value="${esc(state.country_code || 'EG')}" placeholder="EG"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Currency</label><select id="vlpCurrency" class="form-input">${currencies}</select></div>
            <div class="form-group"><label>Timezone</label><input id="vlpTimezone" class="form-input" value="${esc(state.timezone || 'UTC')}"></div>
          </div>
          <div class="form-group"><label>Date / Number Locale</label><input id="vlpDateLocale" class="form-input" value="${esc(state.date_locale)}" readonly aria-readonly="true"></div>
          <button class="btn btn-primary btn-block" style="margin-top:.5rem">💾 Save Global Preferences</button>
        </form>
      </div>`;
  }

  window.VELORA_SAVE_GLOBAL_PREFERENCES = savePreferences;
  window.renderGlobalPreferences = renderGlobalPreferences;

  // Extend the existing account surface without changing authentication behaviour.
  const originalRenderAccount = window.renderAccountPage;
  if (typeof originalRenderAccount === 'function') {
    window.renderAccountPage = function() {
      originalRenderAccount();
      const container = document.getElementById('accountContent');
      if (!container || !STATE?.user) return;
      let host = document.getElementById('veloraGlobalPreferences');
      if (!host) { host = document.createElement('div'); host.id = 'veloraGlobalPreferences'; container.appendChild(host); }
      renderGlobalPreferences();
    };
  }

  window.addEventListener('velora:languagechange', () => setTimeout(renderGlobalPreferences, 0));
  window.addEventListener('velora:global-locale-change', () => setTimeout(renderGlobalPreferences, 0));

  async function bootGlobalLocale() {
    normalizeState();
    syncLocaleUi();
    await loadContext();
    const c = db();
    if (c?.auth?.onAuthStateChange && !window.__VELORA_GLOBAL_LOCALE_AUTH_BOUND) {
      window.__VELORA_GLOBAL_LOCALE_AUTH_BOUND=true;
      c.auth.onAuthStateChange(() => setTimeout(() => loadContext(),0));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootGlobalLocale, {once:true});
  else bootGlobalLocale();
})();
