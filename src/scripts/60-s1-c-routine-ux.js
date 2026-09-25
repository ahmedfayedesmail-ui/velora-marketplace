/* ============================================================
   VELORA — Sprint 1 Phase C Routine UX
   Customer-safe presentation for beauty-routine.v1.
   Does not own Quiz v2 persistence or commerce integration.
   ============================================================ */
(function () {
  'use strict';

  const ROOT_ID = 'veloraRoutineUxModal';
  const STATUS = new Set(['complete', 'partial', 'no_matches']);
  let rolloverTimer = null;
  let rolloverInFlight = false;
  let lastContextDate = null;

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

  function reasonMeta(code) {
    const map = {
      goal_match: ['Goal match', 'مطابقة الهدف', 'goal'],
      concern_match: ['Concern match', 'مطابقة الاهتمام', 'concern'],
      skin_type_match: ['Skin type match', 'مطابقة نوع البشرة', 'skin'],
      step_match: ['Step fit', 'مناسب للخطوة', 'step'],
      availability_match: ['In stock', 'متاح حاليًا', 'availability'],
      budget_fit: ['Budget fit', 'داخل الميزانية', 'budget']
    };
    return map[code] || [String(code || 'Rule match'), String(code || 'مطابقة قاعدة'), 'rule'];
  }

  function reasonText(reasonCodes) {
    const codes = Array.isArray(reasonCodes) ? reasonCodes.filter(Boolean) : [];
    if (!codes.length) return t('No selection evidence returned.', 'لم يتم إرجاع دليل اختيار.');
    return codes.map((code) => {
      const meta = reasonMeta(code);
      return t(meta[0], meta[1]);
    }).join(' · ');
  }

  function reasonChips(reasonCodes) {
    const codes = Array.isArray(reasonCodes) ? reasonCodes.filter(Boolean) : [];
    return codes.map((code) => {
      const meta = reasonMeta(code);
      return '<span class="velora-routine-reason-chip velora-routine-reason-' + escapeHtml(meta[2]) + '">'
        + escapeHtml(t(meta[0], meta[1])) + '</span>';
    }).join('');
  }

  function passportValue(group, key) {
    const labels = {
      skin_type: {
        oily: ['Oily', 'دهنية'],
        dry: ['Dry', 'جافة'],
        combination: ['Combination', 'مختلطة'],
        normal: ['Normal', 'عادية'],
        unknown: ["I don't know", 'مش عارفة']
      },
      goal: {
        brightening: ['Brightening & even-looking skin', 'إشراقة وتوحيد مظهر البشرة'],
        hydration: ['Hydration', 'ترطيب البشرة'],
        acne: ['Blemish-prone skin care', 'العناية بالبشرة المعرضة للحبوب'],
        'anti-aging': ['Anti-aging appearance', 'تحسين مظهر علامات التقدم في السن'],
        oil: ['Reduce excess oil & shine', 'تقليل اللمعان والزيوت الزائدة']
      },
      routine_budget: {
        under_500: ['Under EGP 500', 'أقل من 500 جنيه'],
        '500_1000': ['EGP 500–1,000', 'من 500 لـ 1000 جنيه'],
        '1000_2000': ['EGP 1,000–2,000', 'من 1000 لـ 2000 جنيه'],
        over_2000: ['Over EGP 2,000', 'أكتر من 2000 جنيه'],
        unknown: ["I don't know", 'مش عارفة']
      }
    };
    const pair = labels[group]?.[key];
    return pair ? t(pair[0], pair[1]) : String(key || '—');
  }

  async function loadPassportSummary() {
    try {
      const client = getClient();
      const { data, error } = await client
        .from('beauty_profiles')
        .select('skin_type,goal,routine_budget')
        .maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (_) {
      return null;
    }
  }

  async function loadContext() {
    const client = getClient();
    const { data, error } = await client.rpc('velora_get_beauty_context');
    if (error) throw error;
    return data || null;
  }

  function cairoDate() {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Cairo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function seasonLabel(season) {
    const labels = {
      winter: ['Winter', 'الشتاء'],
      spring: ['Spring', 'الربيع'],
      summer: ['Summer', 'الصيف'],
      autumn: ['Autumn', 'الخريف']
    };
    const pair = labels[String(season || '').toLowerCase()] || [season || '—', season || '—'];
    return t(pair[0], pair[1]);
  }

  function renderContextBasis(context) {
    if (!context) return '';

    const season = seasonLabel(context.season);
    const date = String(context.context_date || cairoDate());
    const basis = String(context.season_basis || 'meteorological_calendar');
    const basisLabel = basis === 'meteorological_calendar'
      ? t('Egypt calendar season', 'الموسم حسب التقويم المناخي في مصر')
      : basis;

    return [
      '<div class="velora-routine-basis">',
      '<div class="velora-routine-basis-title">', escapeHtml(t('Current beauty context', 'السياق الحالي للروتين')), '</div>',
      '<div class="velora-routine-basis-grid">',
      '<div class="velora-routine-basis-item"><span>', escapeHtml(t('Season', 'الموسم')), '</span><strong>', escapeHtml(season), '</strong></div>',
      '<div class="velora-routine-basis-item"><span>', escapeHtml(t('Egypt local date', 'التاريخ المحلي في مصر')), '</span><strong>', escapeHtml(date), '</strong></div>',
      '<div class="velora-routine-basis-item"><span>', escapeHtml(t('Basis', 'الأساس')), '</span><strong>', escapeHtml(basisLabel), '</strong></div>',
      '</div>',
      '<div class="velora-routine-disclaimer">', escapeHtml(t(
        'The season is calculated automatically from the Egypt-local calendar date. Real-time weather is not used to define the season yet.',
        'الموسم بيتحدد تلقائيًا من التاريخ المحلي في مصر. الطقس اللحظي لسه مش هو اللي بيحدد الموسم.'
      )), '</div>',
      '</div>'
    ].join('');
  }

  async function refreshForContextChange(force) {
    const modal = document.getElementById(ROOT_ID);
    if (!modal || !modal.classList.contains('active') || rolloverInFlight) return;

    rolloverInFlight = true;

    try {
      // The server is authoritative for Egypt-local date/season. The browser
      // clock is never used to decide whether the routine context changed.
      const context = await loadContext();
      const serverDate = String(context?.context_date || '');
      if (!serverDate) return;

      if (!force && lastContextDate && serverDate === lastContextDate) return;

      const body = document.getElementById('veloraRoutineBody');
      if (body) {
        body.innerHTML = '<div class="velora-variant-loading">' + escapeHtml(t('Updating your routine for the new date…', 'بنحدّث روتينك حسب التاريخ الجديد…')) + '</div>';
      }

      const [data, passport] = await Promise.all([
        generate(),
        loadPassportSummary()
      ]);

      lastContextDate = serverDate;
      render(data, passport, context);
    } catch (error) {
      console.error('[Beauty Passport] context refresh failed', error);
    } finally {
      rolloverInFlight = false;
    }
  }

  function startRolloverWatch() {
    if (rolloverTimer) clearInterval(rolloverTimer);
    rolloverTimer = setInterval(() => {
      void refreshForContextChange(false);
    }, 5 * 60 * 1000);
  }

  function ensureStyle() {
    if (document.getElementById('veloraRoutineUxStyle')) return;

    const style = document.createElement('style');
    style.id = 'veloraRoutineUxStyle';
    style.textContent = [
      '#veloraRoutineUxModal .velora-routine-modal{width:min(980px,calc(100vw - 2rem));height:min(90vh,calc(100dvh - 1rem));max-height:calc(100dvh - 1rem);display:flex;flex-direction:column;overflow:hidden;background:var(--card);color:var(--text);border-radius:24px;border:1px solid var(--border);box-shadow:var(--shadow-lg);}',

      '#veloraRoutineUxModal .velora-routine-head{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding:1.25rem 1.25rem .75rem;background:var(--card);z-index:2;border-bottom:1px solid var(--border);flex:0 0 auto;}',

      '#veloraRoutineUxModal .velora-routine-kicker{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--primary);}',
      '#veloraRoutineUxModal .velora-routine-title{font-size:1.7rem;margin:.2rem 0 .25rem;}',
      '#veloraRoutineUxModal .velora-routine-status{font-size:.9rem;color:var(--text-muted);}',
      '#veloraRoutineUxModal .velora-routine-close{width:40px;height:40px;border-radius:50%;background:var(--bg-alt);font-size:1.1rem;flex:0 0 auto;}',
      '#veloraRoutineUxModal .velora-routine-body{padding:1rem 1.25rem 1.25rem;overflow:auto;min-height:0;-webkit-overflow-scrolling:touch;padding-bottom:calc(1.25rem + env(safe-area-inset-bottom));}',

      '#veloraRoutineUxModal .velora-routine-banner{border:1px solid var(--border);background:var(--bg-alt);border-radius:16px;padding:.9rem 1rem;margin-bottom:1rem;}',
      '#veloraRoutineUxModal .velora-routine-banner.complete{border-color:rgba(76,175,80,.35);}',
      '#veloraRoutineUxModal .velora-routine-banner.partial{border-color:rgba(212,169,96,.5);}',
      '#veloraRoutineUxModal .velora-routine-banner.empty{border-color:var(--border);}',
      '#veloraRoutineUxModal .velora-routine-banner strong{display:block;margin-bottom:.15rem;}',
      '#veloraRoutineUxModal .velora-routine-basis{border:1px solid var(--border);background:var(--bg-alt);border-radius:16px;padding:.85rem 1rem;margin-bottom:1rem;}',
      '#veloraRoutineUxModal .velora-routine-basis-title{font-weight:800;margin-bottom:.55rem;}',
      '#veloraRoutineUxModal .velora-routine-basis-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem;}',
      '#veloraRoutineUxModal .velora-routine-basis-item{padding:.6rem .7rem;border:1px solid var(--border);border-radius:12px;background:var(--card);min-width:0;}',
      '#veloraRoutineUxModal .velora-routine-basis-item span{display:block;color:var(--text-muted);font-size:.72rem;margin-bottom:.15rem;}',
      '#veloraRoutineUxModal .velora-routine-basis-item strong{font-size:.82rem;line-height:1.35;overflow-wrap:anywhere;}',
      '#veloraRoutineUxModal .velora-routine-disclaimer{font-size:.75rem;line-height:1.45;color:var(--text-muted);margin-top:.7rem;}',

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
      '#veloraRoutineUxModal .velora-routine-reason{margin-top:.55rem;font-size:.78rem;color:var(--text-muted);line-height:1.45;}',
      '#veloraRoutineUxModal .velora-routine-reason-chips{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.65rem;}',
      '#veloraRoutineUxModal .velora-routine-reason-chip{display:inline-flex;align-items:center;padding:.28rem .48rem;border:1px solid var(--border);border-radius:999px;background:var(--bg-alt);font-size:.68rem;font-weight:750;}',
      '#veloraRoutineUxModal .velora-routine-reason-chip.velora-routine-reason-goal{border-color:rgba(212,112,138,.45);}',
      '#veloraRoutineUxModal .velora-routine-reason-chip.velora-routine-reason-skin{border-color:rgba(105,160,120,.4);}',
      '#veloraRoutineUxModal .velora-routine-reason-chip.velora-routine-reason-budget{border-color:rgba(120,120,170,.35);}',
      '#veloraRoutineUxModal .velora-routine-actions{position:sticky;bottom:0;background:var(--card);padding:.8rem 0 calc(.3rem + env(safe-area-inset-bottom));border-top:1px solid var(--border);z-index:2;}',

      '#veloraRoutineUxModal .velora-routine-unavailable{font-size:.85rem;color:var(--text-muted);margin-top:.35rem;}',
      '#veloraRoutineUxModal .velora-routine-total{display:flex;justify-content:space-between;gap:1rem;align-items:center;border-top:1px solid var(--border);margin-top:1.1rem;padding-top:1rem;}',
      '#veloraRoutineUxModal .velora-routine-total strong{font-size:1.15rem;}',
      '#veloraRoutineUxModal .velora-routine-actions{display:flex;justify-content:flex-end;gap:.6rem;margin-top:1rem;}',
      '#veloraRoutineUxModal .velora-routine-actions .btn[aria-disabled="true"]{opacity:.55;cursor:not-allowed;}',
      '@media(max-width:700px){#veloraRoutineUxModal .velora-routine-steps{grid-template-columns:1fr;}#veloraRoutineUxModal .velora-routine-head{padding:.9rem .9rem .7rem}#veloraRoutineUxModal .velora-routine-body{padding:.8rem .9rem calc(.8rem + env(safe-area-inset-bottom))}#veloraRoutineUxModal .velora-routine-title{font-size:1.35rem;}#veloraRoutineUxModal .velora-routine-basis-grid{grid-template-columns:1fr;}#veloraRoutineUxModal .velora-routine-actions{flex-wrap:wrap;}#veloraRoutineUxModal .velora-routine-actions .btn{flex:1 1 100%;min-height:48px;}}'
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
      if (rolloverTimer) {
        clearInterval(rolloverTimer);
        rolloverTimer = null;
      }
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
      '<div class="velora-routine-reason"><strong>', escapeHtml(t('Why it was selected', 'ليه المنتج اتاختار')), ':</strong> ', escapeHtml(reasonText(step.reason_codes)), '</div>',
      '<div class="velora-routine-reason-chips">', reasonChips(step.reason_codes), '</div>',
      '</article>'
    ].join('');
  }

  function bindEditPassport() {
    const button = document.getElementById('veloraRoutineEditPassport');
    if (!button || button.dataset.bound === '1') return;
    button.dataset.bound = '1';
    button.addEventListener('click', () => {
      if (!window.veloraBeautyPassportV2 || typeof window.veloraBeautyPassportV2.open !== 'function') {
        if (typeof showToast === 'function') {
          showToast(t('Editing your answers is not available right now.', 'تعديل الإجابات غير متاح حاليًا.'), 'warning');
        }
        return;
      }
      const modal = document.getElementById(ROOT_ID);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
      window.veloraBeautyPassportV2.open().catch(() => {});
    });
  }

  function render(data, passport, context) {
    if (!data || typeof data !== 'object') throw new Error('BEAUTY_ROUTINE_EMPTY_RESPONSE');

    const status = String(data.status || '');
    if (!STATUS.has(status)) {
      throw new Error('BEAUTY_ROUTINE_INVALID_STATUS');
    }

    const steps = Array.isArray(data.steps) ? data.steps : [];
    window.__VELORA_CURRENT_ROUTINE = data;
    const statusText = document.getElementById('veloraRoutineStatusText');
    const body = document.getElementById('veloraRoutineBody');

    if (!statusText || !body) return;

    statusText.textContent = statusLabel(status);

    if (status === 'no_matches') {
      body.innerHTML = [
        renderContextBasis(context),
        '<div class="velora-routine-banner empty">',
        '<strong>', escapeHtml(t('No matching products right now', 'مفيش منتجات مطابقة حاليًا')), '</strong>',
        '<div class="velora-routine-status">', escapeHtml(t('Your profile is valid, but the current catalog has no eligible match for the routine.', 'البروفايل صالح، لكن الكتالوج الحالي مفيهوش مطابقة مؤهلة للروتين.')), '</div>',
        '</div>',
        '<div class="velora-routine-total"><span>', escapeHtml(t('Total', 'الإجمالي')), '</span><strong>', escapeHtml(formatMoney(data.total_cost || 0, data.currency || 'EGP')), '</strong></div>',
        '<div class="velora-routine-actions">',
        '<button type="button" class="btn btn-outline" id="veloraRoutineEditPassport">',
        escapeHtml(t('Edit my answers', 'عدّلي إجاباتك')),
        '</button>',
        '</div>'
      ].join('');
      bindEditPassport();
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

    const basis = (passport ? [
      '<div class="velora-routine-basis">',
      '<div class="velora-routine-basis-title">', escapeHtml(t('Built from your Beauty Passport', 'مبني على Beauty Passport بتاعك')), '</div>',
      '<div class="velora-routine-basis-grid">',
      '<div class="velora-routine-basis-item"><span>', escapeHtml(t('Skin type', 'نوع البشرة')), '</span><strong>', escapeHtml(passportValue('skin_type', passport.skin_type)), '</strong></div>',
      '<div class="velora-routine-basis-item"><span>', escapeHtml(t('Main goal', 'الهدف الأساسي')), '</span><strong>', escapeHtml(passportValue('goal', passport.goal)), '</strong></div>',
      '<div class="velora-routine-basis-item"><span>', escapeHtml(t('Routine budget', 'ميزانية الروتين')), '</span><strong>', escapeHtml(passportValue('routine_budget', passport.routine_budget)), '</strong></div>',
      '</div>',
      '<div class="velora-routine-disclaimer">', escapeHtml(t('This is a deterministic cosmetic routine generated from your answers and the approved catalog. It is not a medical diagnosis or dermatologist assessment.', 'ده روتين تجميلي محدد بقواعد من إجاباتك والكتالوج المعتمد. مش تشخيص طبي ولا تقييم من طبيب جلدية.')), '</div>',
      '</div>'
    ].join('') : '') + renderContextBasis(context);

    body.innerHTML = [
      basis,
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
      '<button type="button" class="btn btn-outline" id="veloraRoutineEditPassport">',
      escapeHtml(t('Edit my answers', 'عدّلي إجاباتك')),
      '</button>',
      '<button type="button" class="btn btn-primary btn-lg" id="veloraRoutineAddAll">',
      escapeHtml(t('Order the whole routine', 'اطلبي الروتين كله')),
      '</button>',
      '</div>'
    ].join('');
    bindEditPassport();
    bindAddAll();
  }

  function bindAddAll() {
    const button = document.getElementById('veloraRoutineAddAll');
    if (!button || button.dataset.bound === '1') return;
    button.dataset.bound = '1';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const adapter = window.veloraRoutineCart;
      if (!adapter || typeof adapter.addAll !== 'function') {
        console.error('[Routine→Cart] public adapter is unavailable');
        if (typeof showToast === 'function') {
          showToast(t('Cart adapter is still loading. Please try again.', 'لسه مكوّن الـCart بيحمّل. جرّبي تاني.'), 'warning');
        }
        return;
      }

      void adapter.addAll().catch((error) => {
        console.error('[Routine→Cart] unhandled add-all error', error);
      });
    });
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
      const [data, passport, context] = await Promise.all([
        generate(),
        loadPassportSummary(),
        loadContext()
      ]);
      lastContextDate = String(context?.context_date || cairoDate());
      render(data, passport, context);
      startRolloverWatch();
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

  window.veloraRoutineUX = Object.freeze({
    open,
    generate
  });
})();