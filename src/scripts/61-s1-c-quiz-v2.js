/* ============================================================
   VELORA — Sprint 1 Phase C Quiz v2 UX
   Customer-facing 3-question Routine Discovery flow.
   Persists only through velora_save_beauty_passport_v2.
   ============================================================ */
(function () {
  'use strict';

  const ROOT_ID = 'veloraQuizV2Modal';
  const QUIZ_VERSION = 'beauty-quiz.v2';
  const QUESTIONS = [
    {
      id: 'skin_type',
      ar: 'بشرتك عاملة إزاي؟',
      en: 'What is your skin type?',
      subtitleAr: 'اختاري الأقرب ليكي. مش متأكدة؟ اختاري "مش عارفة".',
      subtitleEn: 'Choose the closest match. Not sure? Pick "I don\'t know".',
      options: [
        { value: 'oily', ar: 'دهنية', en: 'Oily' },
        { value: 'dry', ar: 'جافة', en: 'Dry' },
        { value: 'combination', ar: 'مختلطة', en: 'Combination' },
        { value: 'normal', ar: 'عادية', en: 'Normal' },
        { value: 'unknown', ar: 'مش عارفة', en: "I don't know" }
      ]
    },
    {
      id: 'goal',
      ar: 'إيه أكبر حاجة عايزة تحسّنيها؟',
      en: 'What is the main thing you want to improve?',
      subtitleAr: 'اختاري هدف تجميلي واحد أساسي للروتين.',
      subtitleEn: 'Choose one primary cosmetic goal for your routine.',
      options: [
        { value: 'brightening', ar: 'إشراقة وتوحيد مظهر البشرة', en: 'Brightening & even-looking skin' },
        { value: 'hydration', ar: 'ترطيب البشرة', en: 'Hydration' },
        { value: 'acne', ar: 'العناية بالبشرة المعرضة للحبوب', en: 'Blemish-prone skin care' },
        { value: 'anti-aging', ar: 'تحسين مظهر الخطوط والعلامات', en: 'Improve the look of lines & signs of aging' },
        { value: 'oil', ar: 'تقليل اللمعان والزيوت الزائدة', en: 'Reduce excess oil & shine' }
      ]
    },
    {
      id: 'routine_budget',
      ar: 'ميزانيتك للروتين؟',
      en: 'What is your routine budget?',
      subtitleAr: 'دي ميزانية الروتين كله، مش اشتراك شهري.',
      subtitleEn: 'This is the budget for the whole routine, not a monthly subscription.',
      options: [
        { value: 'under_500', ar: 'أقل من 500 جنيه', en: 'Under EGP 500' },
        { value: '500_1000', ar: 'من 500 لـ 1000 جنيه', en: 'EGP 500–1,000' },
        { value: '1000_2000', ar: 'من 1000 لـ 2000 جنيه', en: 'EGP 1,000–2,000' },
        { value: 'over_2000', ar: 'أكتر من 2000 جنيه', en: 'Over EGP 2,000' },
        { value: 'unknown', ar: 'مش عارفة', en: "I don't know" }
      ]
    }
  ];

  let state = {
    step: 0,
    answers: {
      skin_type: null,
      goal: null,
      routine_budget: null
    },
    busy: false
  };

  function getClient() {
    const client = window.supabaseClient || window.mahaSupabase || null;
    if (!client || typeof client.rpc !== 'function' || !client.auth) {
      throw new Error('Supabase client not available');
    }
    return client;
  }

  function isArabic() {
    const select = document.getElementById('languageSelect');
    return ((select && select.value) || document.documentElement.lang || 'en') === 'ar';
  }

  function t(ar, en) {
    return isArabic() ? ar : en;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function ensureStyle() {
    if (document.getElementById('veloraQuizV2Style')) return;
    const style = document.createElement('style');
    style.id = 'veloraQuizV2Style';
    style.textContent = [
      '#veloraQuizV2Modal .velora-quiz-modal{width:min(720px,calc(100vw - 1.25rem));max-height:92vh;overflow:auto;background:var(--card);color:var(--text);border-radius:24px;border:1px solid var(--border);box-shadow:var(--shadow-lg);}',
      '#veloraQuizV2Modal .velora-quiz-head{padding:1rem 1rem .75rem;border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--card);z-index:2;}',
      '#veloraQuizV2Modal .velora-quiz-head-row{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;}',
      '#veloraQuizV2Modal .velora-quiz-kicker{font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--primary);}',
      '#veloraQuizV2Modal .velora-quiz-title{margin:.2rem 0 0;font-size:1.55rem;}',
      '#veloraQuizV2Modal .velora-quiz-progress{font-size:.78rem;color:var(--text-muted);margin-top:.25rem;}',
      '#veloraQuizV2Modal .velora-quiz-close{width:40px;height:40px;border-radius:50%;background:var(--bg-alt);flex:0 0 auto;}',
      '#veloraQuizV2Modal .velora-quiz-progress-bar{height:6px;border-radius:999px;background:var(--bg-alt);overflow:hidden;margin-top:.75rem;}',
      '#veloraQuizV2Modal .velora-quiz-progress-fill{height:100%;background:linear-gradient(90deg,var(--primary),var(--secondary));transition:width .2s ease;}',
      '#veloraQuizV2Modal .velora-quiz-body{padding:1rem;}',
      '#veloraQuizV2Modal .velora-quiz-question{font-size:1.3rem;margin-bottom:.25rem;}',
      '#veloraQuizV2Modal .velora-quiz-subtitle{color:var(--text-muted);font-size:.88rem;margin-bottom:1rem;}',
      '#veloraQuizV2Modal .velora-quiz-options{display:grid;gap:.7rem;}',
      '#veloraQuizV2Modal .velora-quiz-option{width:100%;text-align:start;padding:1rem;border:1px solid var(--border);border-radius:16px;background:var(--card);transition:.15s ease;display:flex;align-items:center;justify-content:space-between;gap:1rem;}',
      '#veloraQuizV2Modal .velora-quiz-option:hover{border-color:var(--primary);transform:translateY(-1px);}',
      '#veloraQuizV2Modal .velora-quiz-option.selected{border-color:var(--primary);box-shadow:0 0 0 2px rgba(212,112,138,.12);background:var(--bg-alt);}',
      '#veloraQuizV2Modal .velora-quiz-option-copy{display:flex;flex-direction:column;gap:.15rem;min-width:0;}',
      '#veloraQuizV2Modal .velora-quiz-option-main{font-weight:750;line-height:1.35;}',
      '#veloraQuizV2Modal .velora-quiz-option-sub{font-size:.76rem;color:var(--text-muted);}',
      '#veloraQuizV2Modal .velora-quiz-check{width:24px;height:24px;border-radius:50%;border:1px solid var(--border);display:grid;place-items:center;flex:0 0 auto;}',
      '#veloraQuizV2Modal .velora-quiz-option.selected .velora-quiz-check{border-color:var(--primary);background:var(--primary);color:#fff;}',
      '#veloraQuizV2Modal .velora-quiz-footer{display:flex;justify-content:space-between;gap:.6rem;margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);}',
      '#veloraQuizV2Modal .velora-quiz-error{margin-top:.8rem;padding:.7rem .8rem;border-radius:12px;border:1px solid rgba(244,67,54,.35);background:rgba(244,67,54,.06);font-size:.82rem;}',
      '@media(max-width:600px){#veloraQuizV2Modal .velora-quiz-modal{border-radius:18px;width:calc(100vw - .75rem)}#veloraQuizV2Modal .velora-quiz-body{padding:.8rem}#veloraQuizV2Modal .velora-quiz-question{font-size:1.15rem}}'
    ].join('');
    document.head.appendChild(style);
  }

  function ensureModal() {
    let modal = document.getElementById(ROOT_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = ROOT_ID;
    modal.className = 'modal';
    modal.innerHTML = '<div class="modal-content velora-quiz-modal" role="dialog" aria-modal="true" aria-labelledby="veloraQuizTitle">'
      + '<div class="velora-quiz-head">'
      + '<div class="velora-quiz-head-row"><div><div class="velora-quiz-kicker">Velora Routine Discovery</div><h2 class="velora-quiz-title" id="veloraQuizTitle">'+escapeHtml(t('روتينك','Your Routine'))+'</h2><div class="velora-quiz-progress" id="veloraQuizProgress"></div></div>'
      + '<button type="button" class="velora-quiz-close" id="veloraQuizClose" aria-label="Close">✕</button></div>'
      + '<div class="velora-quiz-progress-bar" aria-hidden="true"><div class="velora-quiz-progress-fill" id="veloraQuizProgressFill"></div></div>'
      + '</div>'
      + '<div class="velora-quiz-body" id="veloraQuizBody"></div>'
      + '</div>';

    document.body.appendChild(modal);

    const close = () => {
      if (state.busy) return;
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };

    document.getElementById('veloraQuizClose').addEventListener('click', close);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) close();
    });

    return modal;
  }

  function currentQuestion() {
    return QUESTIONS[state.step];
  }

  function selectedValue() {
    return state.answers[currentQuestion().id];
  }

  function render(errorMessage) {
    const q = currentQuestion();
    const body = document.getElementById('veloraQuizBody');
    const progress = document.getElementById('veloraQuizProgress');
    const fill = document.getElementById('veloraQuizProgressFill');
    if (!body || !progress || !fill) return;

    const percent = ((state.step + 1) / QUESTIONS.length) * 100;
    progress.textContent = t('سؤال ' + (state.step + 1) + ' من ' + QUESTIONS.length, 'Question ' + (state.step + 1) + ' of ' + QUESTIONS.length);
    fill.style.width = percent + '%';

    const options = q.options.map((option) => {
      const selected = option.value === selectedValue();
      return '<button type="button" class="velora-quiz-option '+(selected?'selected':'')+'" data-value="'+escapeHtml(option.value)+'">'
        + '<span class="velora-quiz-option-copy"><span class="velora-quiz-option-main">'+escapeHtml(t(option.ar, option.en))+'</span>'
        + '<span class="velora-quiz-option-sub">'+escapeHtml(isArabic() ? option.en : option.ar)+'</span></span>'
        + '<span class="velora-quiz-check" aria-hidden="true">'+(selected?'✓':'')+'</span></button>';
    }).join('');

    body.innerHTML = '<h3 class="velora-quiz-question">'+escapeHtml(t(q.ar, q.en))+'</h3>'
      + '<p class="velora-quiz-subtitle">'+escapeHtml(t(q.subtitleAr, q.subtitleEn))+'</p>'
      + '<div class="velora-quiz-options">'+options+'</div>'
      + (errorMessage ? '<div class="velora-quiz-error" role="alert">'+escapeHtml(errorMessage)+'</div>' : '')
      + '<div class="velora-quiz-footer">'
      + '<button type="button" class="btn btn-outline" id="veloraQuizBack" '+(state.step===0?'disabled':'')+'>'+escapeHtml(t('رجوع','Back'))+'</button>'
      + '<button type="button" class="btn btn-primary" id="veloraQuizNext" '+(selectedValue()?'':'disabled')+'>'+escapeHtml(state.step===QUESTIONS.length-1 ? t('احفظي واعملي روتينك','Save & build routine') : t('التالي','Next'))+'</button>'
      + '</div>';

    body.querySelectorAll('.velora-quiz-option').forEach((button) => {
      button.addEventListener('click', () => {
        if (state.busy) return;
        state.answers[q.id] = button.dataset.value;
        render();
      });
    });

    const back = document.getElementById('veloraQuizBack');
    const next = document.getElementById('veloraQuizNext');
    if (back) back.addEventListener('click', () => {
      if (state.busy || state.step === 0) return;
      state.step -= 1;
      render();
    });
    if (next) next.addEventListener('click', () => {
      if (state.busy || !selectedValue()) return;
      if (state.step < QUESTIONS.length - 1) {
        state.step += 1;
        render();
      } else {
        saveAndBuild();
      }
    });
  }

  async function saveAndBuild() {
    state.busy = true;
    render(t('بنحفظ إجاباتك وبنجهّز روتينك…','Saving your answers and preparing your routine…'));

    try {
      const client = getClient();
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError) throw authError;
      if (!authData || !authData.user) {
        throw new Error('AUTH_REQUIRED');
      }

      const { data, error } = await client.rpc('velora_save_beauty_passport_v2', {
        p_skin_type: state.answers.skin_type,
        p_goal: state.answers.goal,
        p_routine_budget: state.answers.routine_budget
      });
      if (error) throw error;
      if (!data) throw new Error('PASSPORT_SAVE_EMPTY');

      const modal = document.getElementById(ROOT_ID);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }

      if (!window.veloraRoutineUX || typeof window.veloraRoutineUX.open !== 'function') {
        throw new Error('ROUTINE_UX_NOT_AVAILABLE');
      }

      state.busy = false;
      await window.veloraRoutineUX.open();
    } catch (error) {
      state.busy = false;
      const code = error && error.message ? error.message : '';
      const message = code === 'AUTH_REQUIRED'
        ? t('سجّلي الدخول الأول عشان نقدر نحفظ روتينك.', 'Please sign in first so we can save your routine.')
        : code === 'INVALID_SKIN_TYPE'
          ? t('اختيار نوع البشرة غير صالح.', 'That skin type is not valid.')
          : code === 'INVALID_ROUTINE_BUDGET'
            ? t('اختيار الميزانية غير صالح.', 'That budget is not valid.')
            : t('حصلت مشكلة في حفظ البيانات. جرّبي تاني.', 'We could not save your answers. Please try again.');
      render(message);
    }
  }

  function reset() {
    state = {
      step: 0,
      answers: { skin_type: null, goal: null, routine_budget: null },
      busy: false
    };
  }

  async function open() {
    ensureStyle();
    const client = getClient();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    if (!authData || !authData.user) {
      throw new Error('AUTH_REQUIRED');
    }

    reset();
    ensureModal().classList.add('active');
    document.body.style.overflow = 'hidden';
    render();
  }

  function isV2Complete(profile) {
    return !!profile
      && profile.quiz_version === QUIZ_VERSION
      && String(profile.skin_type || '').trim() !== ''
      && String(profile.goal || '').trim() !== ''
      && String(profile.routine_budget || '').trim() !== '';
  }

  async function readV2PassportState() {
    const client = getClient();
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    if (!authData || !authData.user) {
      return { authenticated: false, complete: false };
    }

    const { data, error } = await client
      .from('beauty_profiles')
      .select('quiz_version,skin_type,goal,routine_budget')
      .maybeSingle();

    if (error) throw error;

    return {
      authenticated: true,
      complete: isV2Complete(data),
      profile: data || null
    };
  }

  function setEntryLabel(button, complete) {
    if (!button) return;
    button.textContent = complete
      ? t('شوفي روتينك', 'See my routine')
      : t('اعرفي روتينك', 'Build my routine');
    button.dataset.passportState = complete ? 'v2-complete' : 'needs-v2';
  }

  async function refreshEntryPoint() {
    const button = document.getElementById('veloraRoutineEntry');
    if (!button) return;
    try {
      const state = await readV2PassportState();
      setEntryLabel(button, state.complete);
    } catch (_) {
      setEntryLabel(button, false);
    }
  }

  async function handleEntryClick(button) {
    try {
      const state = await readV2PassportState();

      if (state.complete) {
        if (!window.veloraRoutineUX || typeof window.veloraRoutineUX.open !== 'function') {
          throw new Error('ROUTINE_UX_NOT_AVAILABLE');
        }
        await window.veloraRoutineUX.open();
        return;
      }

      await open();
    } catch (error) {
      if (error && error.message === 'AUTH_REQUIRED' && typeof handleAccountClick === 'function') {
        handleAccountClick();
        return;
      }
      throw error;
    } finally {
      refreshEntryPoint();
    }
  }

  function installEntryPoint() {
    if (window.__VELORA_QUIZ_V2_ENTRY_INSTALLED) return;
    const heroButtons = document.querySelector('.hero-buttons');
    if (!heroButtons) return;
    if (document.getElementById('veloraRoutineEntry')) {
      window.__VELORA_QUIZ_V2_ENTRY_INSTALLED = true;
      refreshEntryPoint();
      return;
    }

    const button = document.createElement('button');
    button.id = 'veloraRoutineEntry';
    button.className = 'btn btn-primary btn-lg';
    button.type = 'button';
    button.textContent = t('اعرفي روتينك','Build my routine');
    button.setAttribute('aria-label', t('اعرفي روتينك','Build my routine'));
    button.addEventListener('click', () => {
      handleEntryClick(button).catch((error) => {
        const code = error && error.message ? error.message : '';
        if (code === 'AUTH_REQUIRED' && typeof handleAccountClick === 'function') {
          handleAccountClick();
        } else if (typeof showToast === 'function') {
          showToast(t('تعذر فتح روتينك. جرّبي تاني.', 'Unable to open your routine. Please try again.'), 'error');
        }
      });
    });
    heroButtons.appendChild(button);
    window.__VELORA_QUIZ_V2_ENTRY_INSTALLED = true;
    refreshEntryPoint();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installEntryPoint, { once: true });
  } else {
    installEntryPoint();
  }

  window.veloraBeautyPassportV2 = Object.freeze({
    quizVersion: QUIZ_VERSION,
    open
  });
})();