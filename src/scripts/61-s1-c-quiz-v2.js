/* ============================================================
   VELORA — Sprint 1 Phase C Quiz v2 UX
   Customer-facing 3-question Routine Discovery flow.
   Persists only through velora_save_beauty_passport_v2.
   ============================================================ */
(function () {
  'use strict';

  const ROOT_ID = 'veloraQuizV2Modal';
  const QUIZ_VERSION = 'beauty-quiz.v2';
  const NATURAL_INPUT_ID = 'veloraQuizIntentInput';
  const NATURAL_INPUT_BUTTON_ID = 'veloraQuizIntentSubmit';
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
        { value: 'sensitive', ar: 'حساسة', en: 'Sensitive' },
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
    busy: false,
    ai: {
      mode: 'manual',
      input: '',
      candidate: null,
      missingFields: [],
      message: '',
      busy: false
    }
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
      '#veloraQuizV2Modal .velora-quiz-natural{margin-bottom:1.2rem;padding:1rem;border:1px solid var(--border);border-radius:18px;background:var(--bg-alt);}',
      '#veloraQuizV2Modal .velora-quiz-natural-label{display:block;font-weight:800;margin-bottom:.35rem;}',
      '#veloraQuizV2Modal .velora-quiz-natural-help{font-size:.8rem;color:var(--text-muted);line-height:1.45;margin:0 0 .7rem;}',
      '#veloraQuizV2Modal .velora-quiz-natural-input{width:100%;min-height:108px;resize:vertical;border:1px solid var(--border);border-radius:14px;background:var(--card);color:var(--text);padding:.8rem;font:inherit;line-height:1.5;}',
      '#veloraQuizV2Modal .velora-quiz-natural-actions{display:flex;align-items:center;justify-content:space-between;gap:.6rem;flex-wrap:wrap;margin-top:.7rem;}',
      '#veloraQuizV2Modal .velora-quiz-natural-status{font-size:.76rem;color:var(--text-muted);flex:1 1 220px;}',
      '#veloraQuizV2Modal .velora-quiz-understood{display:grid;gap:.65rem;margin-top:1rem;}',
      '#veloraQuizV2Modal .velora-quiz-understood-row{display:flex;justify-content:space-between;gap:1rem;align-items:center;padding:.75rem .85rem;border:1px solid var(--border);border-radius:12px;background:var(--bg-alt);}',
      '#veloraQuizV2Modal .velora-quiz-understood-row span{color:var(--text-muted);font-size:.8rem;}',
      '#veloraQuizV2Modal .velora-quiz-understood-row strong{text-align:end;}',
      '@media(max-width:600px){#veloraQuizV2Modal .velora-quiz-understood-row{align-items:flex-start;flex-direction:column;gap:.25rem}#veloraQuizV2Modal .velora-quiz-understood-row strong{text-align:start;}}',
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

  function answerLabel(id, value) {
    const question = QUESTIONS.find((item) => item.id === id);
    const option = question?.options?.find((item) => item.value === value);
    return option ? t(option.ar, option.en) : String(value || '—');
  }

  function nextMissingStep(currentIndex, direction) {
    if (state.ai.mode !== 'clarify') return -1;
    let index = currentIndex + direction;
    while (index >= 0 && index < QUESTIONS.length) {
      const question = QUESTIONS[index];
      if (question && state.ai.missingFields.includes(question.id)) return index;
      index += direction;
    }
    return -1;
  }

  function naturalInputMarkup() {
    const status = state.ai.message || (
      state.ai.busy
        ? t('بنراجع كلامك…', 'We are reviewing what you wrote…')
        : t('ممكن تكتبي بطريقتك العادية. ولو حبيتي، كمّلي بالاختيارات العادية.', 'You can describe your routine in your own words, or continue with the regular choices.')
    );
    return '<section class="velora-quiz-natural" aria-labelledby="veloraQuizNaturalLabel">'
      + '<label class="velora-quiz-natural-label" id="veloraQuizNaturalLabel" for="' + NATURAL_INPUT_ID + '">'
      + escapeHtml(t('احكيلنا عن بشرتك والروتين اللي نفسك فيه', 'Tell us about your skin and the routine you want'))
      + '</label>'
      + '<p class="velora-quiz-natural-help">'
      + escapeHtml(t('اكتبي اللي تعرفيه عن بشرتك وهدفك وميزانيتك بأي طريقة مريحة ليكي.', 'Write whatever you know about your skin, your goal, and your budget in the way that feels natural to you.'))
      + '</p>'
      + '<textarea id="' + NATURAL_INPUT_ID + '" class="velora-quiz-natural-input" maxlength="800" '
      + 'placeholder="' + escapeHtml(t('مثال: بشرتي دهنية وعندي حبوب وعايزة روتين بسيط في حدود 700 جنيه.', 'Example: My skin is oily, I have some blemishes, and I want a simple routine around EGP 700.')) + '" '
      + 'aria-describedby="veloraQuizNaturalStatus">' + escapeHtml(state.ai.input) + '</textarea>'
      + '<div class="velora-quiz-natural-actions">'
      + '<button type="button" class="btn btn-outline" id="' + NATURAL_INPUT_BUTTON_ID + '" ' + (state.ai.busy ? 'disabled' : '') + '>'
      + escapeHtml(state.ai.busy ? t('ثواني…', 'One moment…') : t('كمّل من كلامي', 'Continue from my description'))
      + '</button>'
      + '<span id="veloraQuizNaturalStatus" class="velora-quiz-natural-status" aria-live="polite">' + escapeHtml(status) + '</span>'
      + '</div>'
      + '</section>';
  }

  function renderIntentConfirmation(errorMessage) {
    const body = document.getElementById('veloraQuizBody');
    const progress = document.getElementById('veloraQuizProgress');
    const fill = document.getElementById('veloraQuizProgressFill');
    if (!body || !progress || !fill) return;

    progress.textContent = t('مراجعة فهمنا ليكي', 'Review');
    fill.style.width = '100%';

    const rows = QUESTIONS.map((question) => {
      return '<div class="velora-quiz-understood-row">'
        + '<span>' + escapeHtml(t(question.ar, question.en)) + '</span>'
        + '<strong>' + escapeHtml(answerLabel(question.id, state.answers[question.id])) + '</strong>'
        + '</div>';
    }).join('');

    body.innerHTML = '<h3 class="velora-quiz-question">'
      + escapeHtml(t('راجعي اللي فهمناه من كلامك', 'Review what we understood'))
      + '</h3>'
      + '<p class="velora-quiz-subtitle">'
      + escapeHtml(t('دي البيانات اللي هنستخدمها لبناء الروتين. تقدري تعدّلي أي إجابة قبل الحفظ.', 'These are the details we will use to build your routine. You can adjust any answer before saving.'))
      + '</p>'
      + '<div class="velora-quiz-understood">' + rows + '</div>'
      + (errorMessage ? '<div class="velora-quiz-error" role="alert">' + escapeHtml(errorMessage) + '</div>' : '')
      + '<div class="velora-quiz-footer">'
      + '<button type="button" class="btn btn-outline" id="veloraQuizAdjust">'
      + escapeHtml(t('عدّلي الإجابات', 'Adjust answers'))
      + '</button>'
      + '<button type="button" class="btn btn-primary" id="veloraQuizConfirm" ' + (state.ai.busy ? 'disabled' : '') + '>'
      + escapeHtml(t('تأكيد وبناء الروتين', 'Confirm & build routine'))
      + '</button>'
      + '</div>';

    const adjust = document.getElementById('veloraQuizAdjust');
    const confirm = document.getElementById('veloraQuizConfirm');
    if (adjust) adjust.addEventListener('click', () => {
      if (state.ai.busy) return;
      state.ai.mode = 'manual';
      state.ai.missingFields = [];
      state.ai.message = '';
      state.step = 0;
      render();
    });
    if (confirm) confirm.addEventListener('click', () => {
      if (state.ai.busy) return;
      saveAndBuild();
    });
  }

  async function interpretNaturalLanguage() {
    const input = document.getElementById(NATURAL_INPUT_ID);
    const text = String(input?.value || '').trim();
    if (!text || state.ai.busy) return;

    state.ai.input = text;
    state.ai.busy = true;
    state.ai.message = '';
    render();

    try {
      if (!window.veloraBeautyAI || typeof window.veloraBeautyAI.interpret !== 'function') {
        throw new Error('AI_SERVICE_UNAVAILABLE');
      }

      const candidate = await window.veloraBeautyAI.interpret(text);
      state.ai.busy = false;

      if (candidate.decision === 'ready') {
        state.answers = {
          skin_type: candidate.skin_type,
          goal: candidate.goal,
          routine_budget: candidate.routine_budget
        };
        state.ai.candidate = candidate;
        state.ai.mode = 'confirm';
        state.ai.missingFields = [];
        state.ai.message = '';
        render();
        return;
      }

      if (candidate.decision === 'needs_clarification') {
        state.answers = {
          skin_type: candidate.skin_type,
          goal: candidate.goal,
          routine_budget: candidate.routine_budget
        };
        state.ai.candidate = candidate;
        state.ai.mode = 'clarify';
        state.ai.missingFields = candidate.missing_fields.slice();
        state.ai.message = t(
          'فهمنا جزء من احتياجك. خلّينا نكمّل بس المعلومات الناقصة.',
          'We understood part of your request. Let’s fill only the missing details.'
        );
        const firstMissing = nextMissingStep(-1, 1);
        state.step = firstMissing === -1 ? 0 : firstMissing;
        render();
        return;
      }

      // Unsupported/unsafe requests never become Passport data. The customer
      // stays on the existing deterministic/manual path.
      state.ai.mode = 'manual';
      state.ai.missingFields = [];
      state.ai.candidate = candidate;
      state.ai.message = candidate.decision === 'unsafe'
        ? t('خلّينا نكمّل بأسئلة الروتين العادية.', 'Let’s continue with the regular routine questions.')
        : t('خلّينا نكمّل باختيارات الروتين العادية.', 'Let’s continue with the regular routine choices.');
      state.step = 0;
      render();
    } catch (error) {
      state.ai.busy = false;
      state.ai.mode = 'manual';
      state.ai.candidate = null;
      state.ai.missingFields = [];
      state.ai.message = t(
        'مفيش مشكلة — نقدر نكمّل بالأسئلة العادية.',
        'No problem — we can continue with the regular questions.'
      );
      state.step = 0;
      render();
    }
  }

  function render(errorMessage) {
    if (state.ai.mode === 'confirm') {
      renderIntentConfirmation(errorMessage);
      return;
    }

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

    const naturalSurface = state.step === 0 && state.ai.mode === 'manual' ? naturalInputMarkup() : '';
    const clarificationBanner = state.ai.mode === 'clarify'
      ? '<div class="velora-quiz-natural" style="margin-bottom:1rem;"><strong>'
        + escapeHtml(t('معلومة سريعة', 'A quick note'))
        + '</strong><div class="velora-quiz-natural-help" style="margin:.3rem 0 0;">'
        + escapeHtml(state.ai.message || t('هنسأل بس عن اللي ناقص.', 'We will ask only for what is missing.'))
        + '</div></div>'
      : '';

    const previousClarificationStep = state.ai.mode === 'clarify'
      ? nextMissingStep(state.step, -1)
      : state.step - 1;
    const canGoBack = previousClarificationStep >= 0;

    body.innerHTML = naturalSurface
      + clarificationBanner
      + '<h3 class="velora-quiz-question">'+escapeHtml(t(q.ar, q.en))+'</h3>'
      + '<p class="velora-quiz-subtitle">'+escapeHtml(t(q.subtitleAr, q.subtitleEn))+'</p>'
      + '<div class="velora-quiz-options">'+options+'</div>'
      + (errorMessage ? '<div class="velora-quiz-error" role="alert">'+escapeHtml(errorMessage)+'</div>' : '')
      + '<div class="velora-quiz-footer">'
      + '<button type="button" class="btn btn-outline" id="veloraQuizBack" '+(!canGoBack?'disabled':'')+'>'+escapeHtml(t('رجوع','Back'))+'</button>'
      + '<button type="button" class="btn btn-primary" id="veloraQuizNext" '+(selectedValue()?'':'disabled')+'>'+escapeHtml(state.ai.mode === 'clarify'
        ? (nextMissingStep(state.step, 1) === -1 ? t('احفظي واعملي روتينك','Save & build routine') : t('التالي','Next'))
        : (state.step===QUESTIONS.length-1 ? t('احفظي واعملي روتينك','Save & build routine') : t('التالي','Next')))+'</button>'
      + '</div>';

    const naturalSubmit = document.getElementById(NATURAL_INPUT_BUTTON_ID);
    if (naturalSubmit) naturalSubmit.addEventListener('click', () => {
      interpretNaturalLanguage();
    });

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
      if (state.busy) return;
      const previous = state.ai.mode === 'clarify'
        ? nextMissingStep(state.step, -1)
        : state.step - 1;
      if (previous === -1 || previous < 0) return;
      state.step = previous;
      render();
    });
    if (next) next.addEventListener('click', () => {
      if (state.busy || !selectedValue()) return;
      const nextStep = state.ai.mode === 'clarify'
        ? nextMissingStep(state.step, 1)
        : state.step + 1;
      if (nextStep !== -1 && nextStep < QUESTIONS.length) {
        state.step = nextStep;
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

      // Notify persistent account surfaces with the authoritative V2 state.
      // Fire before opening Routine UX so the Passport UI stays current even
      // if the next surface fails to open.
      try {
        window.dispatchEvent(new CustomEvent('velora:passport-v2-updated', {
          detail: {
            quiz_version: QUIZ_VERSION,
            skin_type: state.answers.skin_type,
            goal: state.answers.goal,
            routine_budget: state.answers.routine_budget
          }
        }));
      } catch (_) {}

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
      busy: false,
      ai: {
        mode: 'manual',
        input: '',
        candidate: null,
        missingFields: [],
        message: '',
        busy: false
      }
    };
  }

  async function open() {
    ensureStyle();
    const passportState = await readV2PassportState();
    if (!passportState.authenticated) {
      throw new Error('AUTH_REQUIRED');
    }

    reset();

    // Editing the Passport must start from the authoritative persisted V2
    // values. A fresh empty quiz here would silently overwrite unchanged
    // answers when the customer edits only one field.
    const profile = passportState.profile;
    if (profile) {
      if (String(profile.skin_type || '').trim() !== '') {
        state.answers.skin_type = String(profile.skin_type);
      }
      if (String(profile.goal || '').trim() !== '') {
        state.answers.goal = String(profile.goal);
      }
      if (String(profile.routine_budget || '').trim() !== '') {
        state.answers.routine_budget = String(profile.routine_budget);
      }
    }

    // Start on the first unanswered question; for a complete Passport, this
    // is Q1 so the customer can intentionally review/change any answer.
    state.step = QUESTIONS.findIndex((question) => !state.answers[question.id]);
    if (state.step === -1) state.step = 0;

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

  window.addEventListener('velora:languagechange', function () {
    refreshEntryPoint();
  });
  
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
    // Keep Guest entry instant: opening Auth is a local UI action and must not
    // wait on Supabase before the modal appears.
    if (!STATE?.user) {
      if (typeof openAuthModal === 'function') {
        openAuthModal('login');
        return;
      }
      if (typeof handleAccountClick === 'function') {
        handleAccountClick();
        return;
      }
      throw new Error('AUTH_UI_NOT_AVAILABLE');
    }

    const state = await readV2PassportState();

    if (state.complete) {
      if (!window.veloraRoutineUX || typeof window.veloraRoutineUX.open !== 'function') {
        throw new Error('ROUTINE_UX_NOT_AVAILABLE');
      }
      await window.veloraRoutineUX.open();
      return;
    }

    await open();
  }

  function installEntryPoint() {
    if (window.__VELORA_QUIZ_V2_ENTRY_INSTALLED) return;
    const heroButtons = document.querySelector('.hero-buttons');
    if (!heroButtons) return;
    const existing = document.getElementById('veloraRoutineEntry');
    if (existing) {
      if (!existing.dataset.bound) {
        existing.dataset.bound = '1';
        existing.addEventListener('click', () => {
          handleEntryClick(existing).catch((error) => {
            const code = error && error.message ? error.message : '';
            if (code === 'AUTH_REQUIRED' && typeof handleAccountClick === 'function') {
              handleAccountClick();
            } else if (typeof showToast === 'function') {
              showToast(t('تعذر فتح روتينك. جرّبي تاني.', 'Unable to open your routine. Please try again.'), 'error');
            }
          });
        });
      }
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

  function normalizeAnswers(input) {
    const source = input && typeof input === 'object' ? input : {};
    const normalized = {};
    QUESTIONS.forEach((question) => {
      const value = source[question.id];
      const allowed = question.options.some((option) => option.value === value);
      if (!allowed) {
        throw new Error('INVALID_' + question.id.toUpperCase());
      }
      normalized[question.id] = value;
    });
    return normalized;
  }

  async function saveAnswersAndBuild(input) {
    if (state.busy) throw new Error('PASSPORT_BUSY');
    const normalized = normalizeAnswers(input);
    state.answers = normalized;
    state.step = QUESTIONS.length - 1;
    await saveAndBuild();
  }

  window.veloraBeautyPassportV2 = Object.freeze({
    quizVersion: QUIZ_VERSION,
    open,
    saveAnswersAndBuild
  });
})();