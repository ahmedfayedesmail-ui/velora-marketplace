/* ============================================================
   VELORA — Sprint 1 Phase C Routine UX
   Customer-safe presentation for beauty-routine.v1.
   Does not own Quiz v2 persistence or commerce integration.
   ============================================================ */
(function () {
  'use strict';

  const ROOT_ID = 'veloraRoutineUxModal';
  const STATUS = new Set(['complete', 'partial', 'no_matches']);

  function getClient() {
    const client = window.supabaseClient || window.mahaSupabase || null;
    if (!client || typeof client.rpc !== 'function') {
      throw new Error('Supabase client not available');
    }
    return client;
  }

  function escapeHtml(value) {
    const text = String(value == null ? '' : value);
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function locale() {
    const select = document.getElementById('languageSelect');
    return (select && select.value) || document.documentElement.lang || 'en';
  }

  function isArabic() {
    return locale() === 'ar';
  }

  function t(en, ar) {
    return isArabic() ? ar : en;
  }

  function formatMoney(value, currency) {
    const amount = Number(value || 0);
    try {
      return new Intl.NumberFormat(isArabic() ? 'ar-EG' : 'en-EG', {
        style: 'currency',
        currency: currency || 'EGP',
        maximumFractionDigits: 2
      }).format(amount);
    } catch (_) {
      return String(amount) + ' ' + String(currency || 'EGP');
    }
  }

  function stepLabel(stepType) {
    const labels = {
      cleanse: ['Cleanse', 'تنظيف'],
      treat: ['Treat', 'علاج/تركيز'],
      moisturize: ['Moisturize', 'ترطيب'],
      protect: ['Protect', 'حماية']
    };
    const pair = labels[stepType] || [stepType, stepType];
    return t(pair[0], pair[1]);
  }

  function timeLabel(time) {
    return time === 'pm' ? t('PM', 'مساءً') : t('AM', 'صباحًا');
  }

  function statusLabel(status) {
    if (status === 'partial') return t('Your routine is partially available.', 'روتينك متاح بشكل جزئي.');
    if (status === 'no_matches') return t('We could not find matching products right now.', 'لم نجد منتجات مطابقة لروتينك حاليًا.');
    return t('Your routine is ready.', 'روتينك جاهز.');
  }

  function statusTone(status) {
    return status === 'complete' ? 'complete' : status === 'partial' ? 'partial' : 'empty';
  }

  function reasonText(reasonCodes) {
    const code = Array.isArray(reasonCodes) ? reasonCodes.find(Boolean) : null;
    const second = Array.isArray(reasonCodes) ? reasonCodes.slice(1).find(Boolean) : null;

    const map = {
      goal_match: ['Matches your selected goal.', 'مناسب لهدفك في الروتين.'],
      concern_match: ['Matches your selected concern.', 'مرتبط باهتمامك الأساسي.'],
      skin_type_match: ['Fits your selected skin type.', 'مناسب لنوع بشرتك المختار.'],
      step_match: ['Fits this routine step.', 'مناسب لخطوة الروتين.'],
      availability_match: ['Available in the catalog now.', 'متاح حاليًا في الكتالوج.'],
      budget_fit: ['Fits your routine budget.', 'داخل ميزانية الروتين.']
    };

    const firstPair = map[code] || map.step_match;
    const first = t(firstPair[0], firstPair[1]);

    if (!second || !map[second]) return first;

    const secondPair = map[second];
    return first + ' ' + t(secondPair[0], secondPair[1]);
  }

  function ensureStyle() {
    if (document.getElementById('veloraRoutineUxStyle')) return;

    const style = document.createElement('style');
    style.id = 'veloraRoutineUxStyle';
    style.textContent = [
      '#veloraRoutineUxModal .velora-routine-modal{width:min(980px,calc(100vw - 2rem));max-height:90vh;overflow:auto;background:var(--card);color:var(--text);border-radius:24px;border:1px solid var(--border);box-shadow:var(--shadow-lg);}',
      '#veloraRoutineUxModal .velora-routine-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding:1.25rem 1.25rem .75rem;position:sticky;top:0;background:var(--card);z-index:2;border-bottom:1px solid var(--border);}',
      '#veloraRoutineUxModal .velora-routine-kicker{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--primary);}',
      '#veloraRoutineUxModal .velora-routine-title{font-size:1.7rem;margin:.2rem 0 .25rem;}',
      '#veloraRoutineUxModal .velora-routine-status{font-size:.9rem;color:var(--text-muted);}',
      '#veloraRoutineUxModal .velora-routine-close{width:40px;height:40px;border-radius:50%;background:var(--bg-alt);font-size:1.1rem;flex:0 0 auto;}',
      '#veloraRoutineUxModal .velora-routine-body{padding:1rem 1.25rem 1.25rem;}',
      '#veloraRoutineUxModal .velora-routine-banner{border:1px solid var(--border);background:var(--bg-alt);border-radius:16px;padding:.9rem 1rem;margin-bottom:1rem;}',
      '#veloraRoutineUxModal .velora-routine-banner.complete{border-color:rgba(76,175,80,.35);}',
      '#veloraRoutineUxModal .velora-routine-banner.partial{border-color:rgba(212,169,96,.5);}',
      '#veloraRoutineUxModal .velora-routine-banner.empty{border-color:var(--border);}',
      '#veloraRoutineUxModal .velora-routine-banner strong{display:block;margin-bottom:.15rem;}',
      '#veloraRoutineUxModal .velora-routine-group{margin-top:1rem;}',
      '#veloraRoutineUxModal .velora-routine-group h3{font-size:1rem;margin-bottom:.65rem;}',
      '#veloraRoutineUxModal .velora-routine-steps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;}',
      '#veloraRoutineUxModal .velora-routine-step{border:1px solid var(--border);border-radius:18px;padding:1rem;background:var(--card);min-width:0;}',
      '#veloraRoutineUxModal .velora-routine-step.unavailable{background:var(--bg-alt);}',
      '#veloraRoutineUxModal .velora-routine-step-meta{display:flex;justify-content:space-between;gap:.75rem;align-items:center;font-size:.75rem;color:var(--text-muted);margin-bottom:.6rem;}',
      '#veloraRoutineUxModal .velora-routine-step-order{font-weight:800;color:var(--primary);}',
      '#veloraRoutineUxModal .velora-routine-product-name{font-weight:800;font-size:1rem;line-height:1.35;}',
      '#veloraRoutineUxModal .velora-routine-brand{color:var(--text-muted);font-size:.82rem;margin-top:.15rem;}',
      '#veloraRoutineUxModal .velora-routine-price{font-weight:800;margin-top:.55rem;}',
      '#veloraRoutineUxModal .velora-routine-variant{display:inline-flex;gap:.35rem;align-items:center;margin-top:.45rem;padding:.3rem .55rem;border-radius:999px;background:var(--bg-alt);font-size:.74rem;}',
      '#veloraRoutineUxModal .velora-routine-reason{margin-top:.7rem;font-size:.8rem;color:var(--text-muted);line-height:1.45;}',
      '#veloraRoutineUxModal .velora-routine-unavailable{font-size:.85rem;color:var(--text-muted);margin-top:.35rem;}',
      '#veloraRoutineUxModal .velora-routine-total{display:flex;justify-content:space-between;gap:1rem;align-items:center;border-top:1px solid var(--border);margin-top:1.1rem;padding-top:1rem;}',
      '#veloraRoutineUxModal .velora-routine-total strong{font-size:1.15rem;}',
      '#veloraRoutineUxModal .velora-routine-actions{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1rem;}',
      '#veloraRoutineUxModal .velora-routine-actions .btn[aria-disabled="true"]{opacity:.55;cursor:not-allowed;}',
      '@media(max-width:700px){#veloraRoutineUxModal .velora-routine-steps{grid-template-columns:1fr;}#veloraRoutineUxModal .velora-routine-head{padding:.9rem .9rem .7rem}#veloraRoutineUxModal .velora-routine-body{padding:.8rem .9rem 1rem}#veloraRoutineUxModal .velora-routine-title{font-size:1.35rem;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureModal() {
    let modal = document.getElementById(ROOT_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = ROOT_ID;
    modal.className = 'modal';
    modal.innerHTML = [
      '<div class="modal-content velora-routine-modal">',
      '<div class="velora-routine-head">',
      '<div><div class="velora-routine-kicker">Velora Beauty Passport</div><h2 class="velora-routine-title">', escapeHtml(t('Your Routine', 'روتينك')), '</h2><div class="velora-routine-status" id="veloraRoutineStatusText"></div></div>',
      '<button type="button" class="velora-routine-close" id="veloraRoutineClose" aria-label="Close">✕</button>',
      '</div>',
      '<div class="velora-routine-body" id="veloraRoutineBody"><div class="velora-variant-loading">', escapeHtml(t('Loading your routine…', 'بنجهّز روتينك…')), '</div></div>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);

    const close = () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };

    document.getElementById('veloraRoutineClose').addEventListener('click', close);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) close();
    });

    return modal;
  }

  function renderStep(step) {
    const product = step && step.product;
    const variant = step && step.variant;
    const selected = step && step.selection_status === 'selected';

    if (!selected || !product) {
      return [
        '<article class="velora-routine-step unavailable">',
        '<div class="velora-routine-step-meta"><span class="velora-routine-step-order">#', escapeHtml(step.step_order), '</span><span>', escapeHtml(timeLabel(step.time_of_day)), '</span></div>',
        '<div class="velora-routine-product-name">', escapeHtml(stepLabel(step.step_type)), '</div>',
        '<div class="velora-routine-unavailable">', escapeHtml(t('Currently unavailable. No replacement was added.', 'غير متاح حاليًا، ومش هنضيف بديل مصطنع.')), '</div>',
        '</article>'
      ].join('');
    }

    const price = variant && variant.price != null ? variant.price : product.price;

    return [
      '<article class="velora-routine-step">',
      '<div class="velora-routine-step-meta"><span class="velora-routine-step-order">#', escapeHtml(step.step_order), ' · ', escapeHtml(stepLabel(step.step_type)), '</span><span>', escapeHtml(timeLabel(step.time_of_day)), '</span></div>',
      '<div class="velora-routine-product-name">', escapeHtml(product.name), '</div>',
      '<div class="velora-routine-brand">', escapeHtml(product.brand || ''), '</div>',
      '<div class="velora-routine-price">', escapeHtml(formatMoney(price, product.currency || 'EGP')), '</div>',
      variant ? '<div class="velora-routine-variant">✓ ' + escapeHtml(variant.name || t('Selected variant', 'الاختيار')) + '</div>' : '',
      '<div class="velora-routine-reason">', escapeHtml(reasonText(step.reason_codes)), '</div>',
      '</article>'
    ].join('');
  }

  function render(data) {
    if (!data || typeof data !== 'object') throw new Error('BEAUTY_ROUTINE_EMPTY_RESPONSE');

    const status = String(data.status || '');
    if (!STATUS.has(status)) {
      throw new Error('BEAUTY_ROUTINE_INVALID_STATUS');
    }

    const steps = Array.isArray(data.steps) ? data.steps : [];
    const statusText = document.getElementById('veloraRoutineStatusText');
    const body = document.getElementById('veloraRoutineBody');

    if (!statusText || !body) return;

    statusText.textContent = statusLabel(status);

    if (status === 'no_matches') {
      body.innerHTML = [
        '<div class="velora-routine-banner empty">',
        '<strong>', escapeHtml(t('No matching products right now', 'مفيش منتجات مطابقة حاليًا')), '</strong>',
        '<div class="velora-routine-status">', escapeHtml(t('Your profile is valid, but the current catalog has no eligible match for the routine.', 'البروفايل صالح، لكن الكتالوج الحالي مفيهوش مطابقة مؤهلة للروتين.')), '</div>',
        '</div>',
        '<div class="velora-routine-total"><span>', escapeHtml(t('Total', 'الإجمالي')), '</span><strong>', escapeHtml(formatMoney(data.total_cost || 0, data.currency || 'EGP')), '</strong></div>'
      ].join('');
      return;
    }

    const amSteps = steps.filter((step) => step.time_of_day === 'am');
    const pmSteps = steps.filter((step) => step.time_of_day === 'pm');

    const sections = [];
    if (amSteps.length) {
      sections.push('<div class="velora-routine-group"><h3>', escapeHtml(t('Morning', 'الصباح')), '</h3><div class="velora-routine-steps">', amSteps.map(renderStep).join(''), '</div></div>');
    }
    if (pmSteps.length) {
      sections.push('<div class="velora-routine-group"><h3>', escapeHtml(t('Evening', 'المساء')), '</h3><div class="velora-routine-steps">', pmSteps.map(renderStep).join(''), '</div></div>');
    }

    body.innerHTML = [
      '<div class="velora-routine-banner ', escapeHtml(statusTone(status)), '">',
      '<strong>', escapeHtml(statusText.textContent), '</strong>',
      '<div class="velora-routine-status">',
      escapeHtml(status === 'partial'
        ? t('We show only what the approved catalog can support right now.', 'هنعرض بس اللي الكتالوج المعتمد يقدر يدعمه حاليًا.')
        : t('Each product is shown with the evidence used by the routine rules.', 'كل منتج ظاهر مع سبب الاختيار المبني على بيانات وقواعد الروتين.')),
      '</div>',
      '</div>',
      sections.join(''),
      '<div class="velora-routine-total"><span>', escapeHtml(t('Routine total', 'إجمالي الروتين')), '</span><strong>', escapeHtml(formatMoney(data.total_cost || 0, data.currency || 'EGP')), '</strong></div>',
      '<div class="velora-routine-actions">',
      '<button type="button" class="btn btn-primary btn-lg" aria-disabled="true" title="Sprint 1 integration">',
      escapeHtml(t('Order the whole routine', 'اطلبي الروتين كله')),
      '</button>',
      '</div>'
    ].join('');
  }

  async function generate() {
    const client = getClient();
    const { data, error } = await client.rpc('velora_generate_beauty_routine');
    if (error) throw error;
    return data;
  }

  async function open() {
    ensureStyle();
    const modal = ensureModal();
    const body = document.getElementById('veloraRoutineBody');
    const statusText = document.getElementById('veloraRoutineStatusText');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (statusText) statusText.textContent = t('Preparing your routine…', 'بنجهّز روتينك…');
    if (body) body.innerHTML = '<div class="velora-variant-loading">' + escapeHtml(t('Loading your routine…', 'بنجهّز روتينك…')) + '</div>';

    try {
      const data = await generate();
      render(data);
      return data;
    } catch (error) {
      if (body) {
        const message = error && error.message === 'PASSPORT_INCOMPLETE'
          ? t('Finish the 3-question Beauty Passport first.', 'كمّلي أسئلة Beauty Passport الثلاثة الأول.')
          : t('We could not load your routine. Please try again.', 'حصلت مشكلة في تحميل روتينك. جرّبي تاني.');
        body.innerHTML = '<div class="velora-routine-banner empty"><strong>' + escapeHtml(message) + '</strong></div>';
      }
      throw error;
    }
  }

  function installEntryPoint() {
    if (window.__VELORA_ROUTINE_UX_ENTRY_INSTALLED) return;
    window.__VELORA_ROUTINE_UX_ENTRY_INSTALLED = true;

    const heroButtons = document.querySelector('.hero-buttons');
    if (heroButtons && !document.getElementById('veloraRoutineEntry')) {
      const button = document.createElement('button');
      button.id = 'veloraRoutineEntry';
      button.className = 'btn btn-outline btn-lg';
      button.type = 'button';
      button.textContent = t('Build my routine', 'اعرفي روتينك');
      button.addEventListener('click', () => open().catch(() => {}));
      heroButtons.appendChild(button);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installEntryPoint, { once: true });
  } else {
    installEntryPoint();
  }

  window.veloraRoutineUX = Object.freeze({
    open,
    generate
  });
})();