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
  const storedLanguage = ['en','ar'].includes((localStorage.getItem('velora_language') || 'en').toLowerCase()) ? (localStorage.getItem('velora_language') || 'en').toLowerCase() : 'en';
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

      // Server context is persistence data, not permission to overwrite a
      // newer client language choice. Local language wins whenever present.
      const localLocale = String(localStorage.getItem('velora_language') || '').toLowerCase();
      const localHasLocale = ['en','ar'].includes(localLocale);
      const r = await c.rpc('velora_get_global_locale_context');
      if (r?.error || !r?.data) return state;

      const server = r.data || {};
      const keepLocale = localHasLocale ? localLocale : (LANG_META[server.locale] ? server.locale : state.locale);

      Object.assign(state, server, {locale: keepLocale});

      if (!CURRENCIES[state.currency_code]) state.currency_code = initialCurrency;
      state.date_locale = canonicalDateLocale(state.locale, state.country_code);

      localStorage.setItem('velora_language', state.locale);
      localStorage.setItem('velora_country', state.country_code);
      localStorage.setItem('velora_currency', state.currency_code);
      localStorage.setItem('velora_date_locale', state.date_locale);

      if (CURRENCIES[state.currency_code]) VELORA_CURRENCY = state.currency_code;

      // Do NOT call window.setVeloraLanguage here. V5 is the only language
      // mutation owner and the user's local locale has already been committed.
      if (typeof document !== 'undefined') {
        document.documentElement.lang = state.locale;
        document.documentElement.dir = LANG_META[state.locale]?.dir || (state.locale === 'ar' ? 'rtl' : 'ltr');
      }
    } catch (_) {}
    return state;
  }

  function canonicalDateLocale(locale, country) {
    const l = String(locale || 'en').toLowerCase();
    const cc = String(country || 'US').toUpperCase();
    return l + '-' + cc;
  }


  const previousSetLanguage = window.setVeloraLanguage;
  window.setVeloraLanguage = async function(code) {
    if (!LANG_META[code]) return false;
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
    const locale = document.getElementById('vlpLanguage')?.value || state.locale;
    const country = (document.getElementById('vlpCountry')?.value || state.country_code).trim().toUpperCase();
    const currency = document.getElementById('vlpCurrency')?.value || state.currency_code;
    const timezone = document.getElementById('vlpTimezone')?.value || state.timezone;
    const dateLocale = canonicalDateLocale(locale, country);
    try {
      // User choice is committed locally before network persistence.
      state.locale = locale;
      state.country_code = country;
      state.currency_code = currency;
      state.timezone = timezone;
      state.date_locale = canonicalDateLocale(locale, country);
      document.documentElement.lang = locale;
      document.documentElement.dir = LANG_META[locale]?.dir || (locale === 'ar' ? 'rtl' : 'ltr');
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
      Object.assign(state, r.data || {}, {locale, country_code:country, currency_code:currency, timezone, date_locale:canonicalDateLocale(locale,country)});
      localStorage.setItem('velora_language', locale);
      localStorage.setItem('velora_country', country);
      localStorage.setItem('velora_currency', currency);
      localStorage.setItem('velora_date_locale', state.date_locale);
      if (typeof window.setVeloraLanguage === 'function') await window.setVeloraLanguage(locale);
      state.date_locale = canonicalDateLocale(locale, country);
      if (CURRENCIES[currency]) VELORA_CURRENCY = currency;
      if (typeof updateCurrencyDisplay === 'function') updateCurrencyDisplay();
      renderGlobalPreferences();
      showToast(typeof trSrc === 'function' && trSrc('Preferences saved','en') !== null ? trSrc('Preferences saved', locale) : 'Preferences saved','success');
    } catch (err) {
      showToast(`⚠️ ${err?.message || 'Could not save preferences'}`, 'error');
    }
  }

  async function renderBeautyPassportCard() {
    const host = document.getElementById('veloraBeautyPassportCard');
    if (!host) return;

    const client = db();
    if (!client?.from || !STATE?.user) {
      host.innerHTML = '';
      return;
    }

    const locale = String(state.locale || document.documentElement.lang || 'en').toLowerCase();
    const tr = (source) => {
      try {
        const translated = window.VELORA_GET_TRANSLATION?.(source, locale);
        return translated || source;
      } catch (_) {
        return source;
      }
    };
    const valueLabels = {
      skin_type: {
        oily: ['Oily','دهنية'],
        dry: ['Dry','جافة'],
        combination: ['Combination','مختلطة'],
        normal: ['Normal','عادية'],
        unknown: ["I don't know",'مش عارفة']
      },
      goal: {
        brightening: ['Brightening & even-looking skin','إشراقة وتوحيد مظهر البشرة'],
        hydration: ['Hydration','ترطيب البشرة'],
        acne: ['Blemish-prone skin care','العناية بالبشرة المعرضة للحبوب'],
        'anti-aging': ['Improve the look of lines & signs of aging','تحسين مظهر الخطوط والعلامات'],
        oil: ['Reduce excess oil & shine','تقليل اللمعان والزيوت الزائدة']
      },
      routine_budget: {
        under_500: ['Under EGP 500','أقل من 500 جنيه'],
        '500_1000': ['EGP 500–1,000','من 500 لـ 1000 جنيه'],
        '1000_2000': ['EGP 1,000–2,000','من 1000 لـ 2000 جنيه'],
        over_2000: ['Over EGP 2,000','أكتر من 2000 جنيه'],
        unknown: ["I don't know",'مش عارفة']
      }
    };

    const label = (source, arFallback) => {
      const translated = tr(source);
      if (translated !== source) return translated;
      return locale === 'ar' ? arFallback : source;
    };
    const value = (group, key) => {
      const pair = valueLabels[group]?.[key];
      if (!pair) return String(key || '—');
      return locale === 'ar' ? pair[1] : pair[0];
    };

    host.innerHTML = '<div class="form-section velora-passport-card">'
      + '<div class="velora-passport-card-head"><div><div class="velora-passport-kicker">'+label("YOUR BEAUTY PASSPORT","Beauty Passport الخاص بيكي")+'</div>'
      + '<h3>'+label('My Beauty Passport','Beauty Passport الخاص بيكي')+'</h3>'
      + '<p class="velora-passport-muted">'+label('Your saved skin profile and routine preferences.','بيانات بشرتك وتفضيلات الروتين المحفوظة.')+'</p></div>'
      + '<span class="velora-passport-badge">V2</span></div>'
      + '<div id="veloraPassportCardBody" class="velora-passport-card-body"><p class="velora-passport-muted">'+label('Loading your Beauty Passport…','بنحمّل Beauty Passport بتاعك…')+'</p></div>'
      + '</div>';

    const body = document.getElementById('veloraPassportCardBody');
    try {
      const {data: authData, error: authError} = await client.auth.getUser();
      if (authError || !authData?.user) {
        body.innerHTML = '<p class="velora-passport-muted">'+label('Sign in to view your Beauty Passport.','سجّلي الدخول عشان تشوفي Beauty Passport بتاعك.')+'</p>';
        return;
      }
      const {data, error} = await client
        .from('beauty_profiles')
        .select('quiz_version,skin_type,goal,routine_budget')
        .maybeSingle();
      if (error) throw error;

      const complete = data?.quiz_version === 'beauty-quiz.v2'
        && data?.skin_type && data?.goal && data?.routine_budget;

      if (!complete) {
        body.innerHTML = '<div class="velora-passport-empty"><p>'+label('Your Beauty Passport is not complete yet.','Beauty Passport بتاعك لسه مش مكتمل.')+'</p>'
          + '<button type="button" class="btn btn-primary" id="veloraPassportStart">'+label('Build my routine','اعملي روتيني')+'</button></div>';
        document.getElementById('veloraPassportStart')?.addEventListener('click', () => window.veloraBeautyPassportV2?.open?.());
        return;
      }

      body.innerHTML = '<div class="velora-passport-grid">'
        + '<div class="velora-passport-field"><span>'+label('Skin type','نوع البشرة')+'</span><strong>'+value('skin_type',data.skin_type)+'</strong></div>'
        + '<div class="velora-passport-field"><span>'+label('Goal','الهدف')+'</span><strong>'+value('goal',data.goal)+'</strong></div>'
        + '<div class="velora-passport-field"><span>'+label('Routine budget','ميزانية الروتين')+'</span><strong>'+value('routine_budget',data.routine_budget)+'</strong></div>'
        + '</div>'
        + '<div class="velora-passport-actions"><button type="button" class="btn btn-outline" id="veloraPassportUpdate">'+label('Update my answers','عدّلي إجاباتك')+'</button></div>';
      document.getElementById('veloraPassportUpdate')?.addEventListener('click', () => window.veloraQuizV2?.open?.());
    } catch (error) {
      body.innerHTML = '<p class="velora-passport-muted">'+label('We could not load your Beauty Passport right now.','مش قادرين نحمّل Beauty Passport دلوقتي.')+'</p>';
      try { console.warn('[Velora Passport] account card load failed', error); } catch (_) {}
    }
  }

  function ensureBeautyPassportHost(container) {
    let host = document.getElementById('veloraBeautyPassportCard');
    if (!host) {
      host = document.createElement('div');
      host.id = 'veloraBeautyPassportCard';
      container.appendChild(host);
    }
    return host;
  }

  function refreshBeautyPassportCard() {
    const container = document.getElementById('accountContent');
    if (!container || !STATE?.user) return;
    ensureBeautyPassportHost(container);
    void renderBeautyPassportCard();
  }

  // Inject the persistent Passport card through the same Account wrapper chain
  // used by Global Preferences; do not replace or bypass the original renderer.
  function renderGlobalPreferences() {
    const host = document.getElementById('veloraGlobalPreferences');
    if (!host) return;
    // Invariant: displayed regional locale follows the active UI language.
    state.date_locale = canonicalDateLocale(state.locale, state.country_code);
    localStorage.setItem('velora_date_locale', state.date_locale);
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
    try{window.VELORA_I18N_RENDER?.(host);}catch(_){}
  }

  function ensureBeautyPassportStyle() {
    if (document.getElementById('veloraBeautyPassportStyle')) return;
    const style = document.createElement('style');
    style.id = 'veloraBeautyPassportStyle';
    style.textContent = [
      '.velora-passport-card{margin-top:1.25rem;border:1px solid rgba(255,255,255,.08);}',
      '.velora-passport-card-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;}',
      '.velora-passport-kicker{font-size:.72rem;font-weight:800;letter-spacing:.08em;color:var(--primary);}',
      '.velora-passport-card-head h3{margin:.25rem 0 .2rem;}',
      '.velora-passport-muted{color:var(--text-muted);margin:.25rem 0 0;}',
      '.velora-passport-badge{border:1px solid var(--border);border-radius:999px;padding:.25rem .55rem;font-size:.72rem;font-weight:800;}',
      '.velora-passport-card-body{margin-top:1rem;}',
      '.velora-passport-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.75rem;}',
      '.velora-passport-field{padding:.8rem;border:1px solid var(--border);border-radius:14px;background:var(--bg-alt);min-width:0;}',
      '.velora-passport-field span{display:block;color:var(--text-muted);font-size:.78rem;margin-bottom:.25rem;}',
      '.velora-passport-field strong{display:block;line-height:1.35;overflow-wrap:anywhere;}',
      '.velora-passport-actions{display:flex;justify-content:flex-end;margin-top:.9rem;}',
      '@media(max-width:700px){.velora-passport-grid{grid-template-columns:1fr 1fr}.velora-passport-field:last-child{grid-column:1/-1}.velora-passport-actions .btn{width:100%}}',
      '@media(max-width:420px){.velora-passport-grid{grid-template-columns:1fr}.velora-passport-field:last-child{grid-column:auto}.velora-passport-card-head{gap:.6rem}.velora-passport-badge{flex:0 0 auto}}'
    ].join('');
    document.head.appendChild(style);
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
      ensureBeautyPassportStyle();
      ensureBeautyPassportHost(container);
      void renderBeautyPassportCard();
    };
  }

  window.addEventListener('velora:languagechange', () => queueMicrotask(() => {
    renderGlobalPreferences();
    refreshBeautyPassportCard();
  }));
  window.addEventListener('velora:global-locale-change', () => queueMicrotask(() => refreshBeautyPassportCard()));
  window.addEventListener('velora:passport-v2-updated', () => queueMicrotask(() => refreshBeautyPassportCard()));
  async function bootGlobalLocale() {
    await loadContext();
    try {
      ensureBeautyPassportStyle();
      renderGlobalPreferences();
      refreshBeautyPassportCard();
    } catch (_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootGlobalLocale, {once:true});
  else bootGlobalLocale();
})();
