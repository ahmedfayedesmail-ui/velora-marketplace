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
      if (!c?.rpc || !STATE?.user) return state;
      const r = await c.rpc('velora_get_global_locale_context');
      if (r?.error || !r?.data) return state;
      Object.assign(state, r.data);
      // Velora staging MVP exposes English + Arabic only. Never allow a legacy
      // server preference (e.g. Spanish) to leak into the UI.
      if (!['en','ar'].includes(String(state.locale || '').toLowerCase())) state.locale = 'en';
      // An empty/invalid server currency must never blank the selector.
      if (!CURRENCIES[state.currency_code]) state.currency_code = initialCurrency;
      // Keep one authoritative locale model for the active MVP languages.
      state.locale = ['en','ar'].includes(String(state.locale || '').toLowerCase())
        ? String(state.locale).toLowerCase()
        : 'en';
      const serverDateLocale = String(state.date_locale || '').toLowerCase();
      if (!serverDateLocale || serverDateLocale.startsWith('es-') || !/^(en|ar)(-[a-z]{2,4})?$/i.test(serverDateLocale)) {
        state.date_locale = state.locale === 'ar' ? 'ar-EG' : 'en-EG';
      }
      localStorage.setItem('velora_language', state.locale);
      localStorage.setItem('velora_country', state.country_code);
      localStorage.setItem('velora_currency', state.currency_code);
      localStorage.setItem('velora_date_locale', state.date_locale);
      if (CURRENCIES[state.currency_code]) {
        VELORA_CURRENCY = state.currency_code;
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) currencySelect.value = state.currency_code;
        try { if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay(); } catch (_) {}
      }
      if (typeof window.setVeloraLanguage === 'function') await window.setVeloraLanguage(state.locale);
      const languageSelect = document.getElementById('languageSelect');
      if (languageSelect) languageSelect.value = state.locale;
      if (typeof document !== 'undefined') {
        document.documentElement.lang = state.locale;
        document.documentElement.dir = LANG_META[state.locale]?.dir || (state.locale === 'ar' ? 'rtl' : 'ltr');
      }
    } catch (_) {}
    return state;
  }

  const previousSetLanguage = window.setVeloraLanguage;
  window.setVeloraLanguage = async function(code) {
    code = String(code || '').toLowerCase();
    if (!['en','ar'].includes(code) || !LANG_META[code]) return false;
    const ok = typeof previousSetLanguage === 'function' ? await previousSetLanguage(code) : true;
    if (!ok) return false;
    state.locale = code;
    localStorage.setItem('velora_language', code);
    document.documentElement.lang = code;
    document.documentElement.dir = LANG_META[code]?.dir || (code === 'ar' ? 'rtl' : 'ltr');
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
    if (!CURRENCIES[code]) return false;
    const ok = typeof previousSetCurrency === 'function' ? previousSetCurrency(code) : true;
    if (!ok) return false;
    state.currency_code = code;
    localStorage.setItem('velora_currency', code);
    try {
      const c = db();
      if (c?.rpc && STATE?.user) {
        await c.rpc('velora_set_global_locale_context', {
          p_locale: state.locale || 'en',
          p_country_code: state.country_code || null,
          p_currency_code: code,
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
    const dateLocale = document.getElementById('vlpDateLocale')?.value || state.date_locale;
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
      Object.assign(state, r.data || {}, {locale, country_code:country, currency_code:currency, timezone, date_locale:dateLocale});
      localStorage.setItem('velora_language', locale);
      localStorage.setItem('velora_country', country);
      localStorage.setItem('velora_currency', currency);
      localStorage.setItem('velora_date_locale', dateLocale);
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
          <div class="form-group"><label>Date / Number Locale</label><input id="vlpDateLocale" class="form-input" value="${esc(state.date_locale || state.locale || 'en-US')}" placeholder="en-US"></div>
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
    await loadContext();
    const c = db();
    if (c && STATE?.user) {
      // Keep the first logged-in session synchronized with the server-side context.
      try {
        const r = await c.rpc('velora_get_global_locale_context');
        if (!r?.error && r?.data) Object.assign(state, r.data);
      } catch (_) {}
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootGlobalLocale, {once:true});
  else bootGlobalLocale();
})();
