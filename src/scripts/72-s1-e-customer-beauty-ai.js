(function () {
  'use strict';

  const ROOT_ID = 'veloraBeautyAiModal';
  const MAX_INPUT_CHARS = 800;
  const SKIN_TYPES = new Set(['oily','dry','combination','normal','sensitive','unknown']);
  const GOALS = new Set(['brightening','hydration','acne','anti-aging','oil']);
  const BUDGETS = new Set(['under_500','500_1000','1000_2000','over_2000','unknown']);
  const MISSING_LABELS = {
    skin_type: ['Skin type', 'نوع البشرة'],
    goal: ['Main goal', 'الهدف الأساسي'],
    routine_budget: ['Routine budget', 'ميزانية الروتين']
  };

  function t(en, ar) {
    return document.documentElement.lang === 'ar' ? ar : en;
  }

  function esc(value) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(String(value == null ? '' : value));
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
    });
  }

  function getClient() {
    const client = window.supabaseClient || window.mahaSupabase || null;
    if (!client || typeof client.functions?.invoke !== 'function') throw new Error('Supabase client not available');
    return client;
  }

  function hasUser() {
    return !!window.STATE?.user;
  }

  function ensureStyle() {
    if (document.getElementById('veloraBeautyAiStyle')) return;
    const style = document.createElement('style');
    style.id = 'veloraBeautyAiStyle';
    style.textContent = [
      '#veloraBeautyAiModal .velora-beauty-ai-modal{width:min(720px,calc(100vw - 1.25rem));max-height:92vh;overflow:auto;background:var(--card);color:var(--text);border-radius:24px;border:1px solid var(--border);box-shadow:var(--shadow-lg);}',
      '#veloraBeautyAiModal .velora-beauty-ai-head{padding:1rem;border-bottom:1px solid var(--border);}',
      '#veloraBeautyAiModal .velora-beauty-ai-title{margin:.1rem 0;font-size:1.45rem;}',
      '#veloraBeautyAiModal .velora-beauty-ai-copy{color:var(--text-muted);font-size:.9rem;line-height:1.6;margin:.35rem 0 0;}',
      '#veloraBeautyAiModal .velora-beauty-ai-body{padding:1rem;}',
      '#veloraBeautyAiModal .velora-beauty-ai-input{width:100%;min-height:150px;resize:vertical;padding:.9rem;border:1px solid var(--border);border-radius:16px;background:var(--bg-alt);color:var(--text);}',
      '#veloraBeautyAiModal .velora-beauty-ai-meta{display:flex;justify-content:space-between;gap:.75rem;margin-top:.45rem;color:var(--text-muted);font-size:.76rem;}',
      '#veloraBeautyAiModal .velora-beauty-ai-result{margin-top:1rem;padding:1rem;border:1px solid var(--border);border-radius:16px;background:var(--bg-alt);}',
      '#veloraBeautyAiModal .velora-beauty-ai-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.65rem;margin-top:.75rem;}',
      '#veloraBeautyAiModal .velora-beauty-ai-field{padding:.75rem;border:1px solid var(--border);border-radius:14px;background:var(--card);}',
      '#veloraBeautyAiModal .velora-beauty-ai-field span{display:block;font-size:.72rem;color:var(--text-muted);margin-bottom:.25rem;}',
      '#veloraBeautyAiModal .velora-beauty-ai-field strong{display:block;line-height:1.3;}',
      '#veloraBeautyAiModal .velora-beauty-ai-actions{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1rem;}',
      '#veloraBeautyAiModal .velora-beauty-ai-close{float:inline-end;width:40px;height:40px;border-radius:50%;background:var(--bg-alt);}',
      '#veloraBeautyAiModal .velora-beauty-ai-error{margin-top:.8rem;padding:.7rem .8rem;border-radius:12px;border:1px solid rgba(244,67,54,.35);background:rgba(244,67,54,.06);font-size:.82rem;}',
      '@media(max-width:650px){#veloraBeautyAiModal .velora-beauty-ai-grid{grid-template-columns:1fr;}.velora-beauty-ai-actions .btn{width:100%;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function labels() {
    return {
      skin_type: {
        oily: ['Oily', 'دهنية'], dry: ['Dry', 'جافة'], combination: ['Combination', 'مختلطة'],
        normal: ['Normal', 'عادية'], sensitive: ['Sensitive', 'حساسة'], unknown: ["I don't know", 'مش عارفة']
      },
      goal: {
        brightening: ['Brightening & even-looking skin', 'إشراقة وتوحيد مظهر البشرة'],
        hydration: ['Hydration', 'ترطيب البشرة'],
        acne: ['Blemish-prone skin care', 'العناية بالبشرة المعرضة للحبوب'],
        'anti-aging': ['Improve the look of lines & signs of aging', 'تحسين مظهر الخطوط والعلامات'],
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
  }

  function displayValue(field, value) {
    const pair = (labels()[field] || {})[value];
    return pair ? t(pair[0], pair[1]) : '—';
  }

  function validateCandidate(candidate) {
    const value = candidate && typeof candidate === 'object' ? candidate : null;
    if (!value) throw new Error('AI_STRUCTURED_OUTPUT_INVALID');
    if (!['ready','needs_clarification','unsupported','unsafe'].includes(value.decision)) throw new Error('AI_DECISION_INVALID');

    const skin = value.skin_type == null ? null : value.skin_type;
    const goal = value.goal == null ? null : value.goal;
    const budget = value.routine_budget == null ? null : value.routine_budget;
    const missing = Array.isArray(value.missing_fields) ? [...new Set(value.missing_fields)] : [];

    if (skin !== null && !SKIN_TYPES.has(skin)) throw new Error('AI_SKIN_TYPE_INVALID');
    if (goal !== null && !GOALS.has(goal)) throw new Error('AI_GOAL_INVALID');
    if (budget !== null && !BUDGETS.has(budget)) throw new Error('AI_BUDGET_INVALID');

    if (value.decision === 'ready') {
      if (skin === null || goal === null || budget === null || missing.length) throw new Error('AI_READY_CONTRACT_INVALID');
    } else if (value.decision === 'needs_clarification') {
      if (!missing.length) throw new Error('AI_CLARIFICATION_CONTRACT_INVALID');
      ['skin_type','goal','routine_budget'].forEach(function (field) {
        const fieldValue = field === 'skin_type' ? skin : field === 'goal' ? goal : budget;
        if (fieldValue === null) {
          if (!missing.includes(field)) throw new Error('AI_CLARIFICATION_CONTRACT_INVALID');
        } else if (missing.includes(field)) {
          throw new Error('AI_CLARIFICATION_CONTRACT_INVALID');
        }
      });
    } else if (skin !== null || goal !== null || budget !== null || missing.length) {
      throw new Error('AI_NON_ACTIONABLE_CONTRACT_INVALID');
    }

    return { decision: value.decision, skin_type: skin, goal, routine_budget: budget, missing_fields: missing };
  }

  function ensureModal() {
    let modal = document.getElementById(ROOT_ID);
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = ROOT_ID;
    modal.className = 'modal';
    modal.innerHTML = '<div class="modal-content velora-beauty-ai-modal" role="dialog" aria-modal="true" aria-labelledby="veloraBeautyAiTitle">'
      + '<div class="velora-beauty-ai-head">'
      + '<button type="button" class="velora-beauty-ai-close" id="veloraBeautyAiClose" aria-label="Close">✕</button>'
      + '<h2 class="velora-beauty-ai-title" id="veloraBeautyAiTitle"></h2>'
      + '<p class="velora-beauty-ai-copy" id="veloraBeautyAiCopy"></p>'
      + '</div>'
      + '<div class="velora-beauty-ai-body" id="veloraBeautyAiBody"></div>'
      + '</div>';
    document.body.appendChild(modal);

    const close = function () {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    };
    document.getElementById('veloraBeautyAiClose').addEventListener('click', close);
    modal.addEventListener('click', function (event) { if (event.target === modal) close(); });
    return modal;
  }

  function setHeader() {
    document.getElementById('veloraBeautyAiTitle').textContent = t('Tell us in your own words', 'احكي لنا بطريقتك');
    document.getElementById('veloraBeautyAiCopy').textContent = t(
      'Describe what you want from your beauty routine. AI only translates your words into the same three Beauty Passport answers; it does not choose products or medical treatment.',
      'احكي محتاجة إيه من روتينك. الـAI بتحوّل كلامك لنفس 3 إجابات في Beauty Passport فقط؛ مش بتختار منتجات ومش بتقدّم علاج طبي.'
    );
  }

  function renderInput(message) {
    const body = document.getElementById('veloraBeautyAiBody');
    const value = document.getElementById('veloraBeautyAiInput')?.value || '';
    body.innerHTML = '<textarea id="veloraBeautyAiInput" class="velora-beauty-ai-input" maxlength="'+MAX_INPUT_CHARS+'" placeholder="'+esc(t('Example: My skin gets oily quickly, I want more hydration, and I want to spend under 500 EGP.', 'مثال: بشرتي بتلمع بسرعة وعايزة ترطيب أكتر وميزانيتي أقل من 500 جنيه.'))+'"></textarea>'
      + '<div class="velora-beauty-ai-meta"><span id="veloraBeautyAiCount">0/'+MAX_INPUT_CHARS+'</span><span>'+esc(t('Your text is sent only to the AI intent interpreter.', 'النص بيتبعت فقط لمفسّر نية الـAI.'))+'</span></div>'
      + '<div class="velora-beauty-ai-actions"><button type="button" class="btn btn-primary" id="veloraBeautyAiSubmit">'+esc(t('Translate my request','حوّل كلامي لإجابات'))+'</button>'
      + '<button type="button" class="btn btn-outline" id="veloraBeautyAiManual">'+esc(t('Use the 3 questions instead','استخدمي الـ3 أسئلة بدل كده'))+'</button></div>'
      + (message ? '<div class="velora-beauty-ai-error" role="alert">'+esc(message)+'</div>' : '');
    const input=document.getElementById('veloraBeautyAiInput');
    input.value=value;
    const updateCount=function(){document.getElementById('veloraBeautyAiCount').textContent=Array.from(input.value).length+'/'+MAX_INPUT_CHARS;};
    input.addEventListener('input',updateCount);
    updateCount();
    document.getElementById('veloraBeautyAiSubmit').addEventListener('click',submit);
    document.getElementById('veloraBeautyAiManual').addEventListener('click',openManualQuiz);
  }

  function renderFallback(message) {
    const body=document.getElementById('veloraBeautyAiBody');
    body.innerHTML='<div class="velora-beauty-ai-result"><strong>'+esc(message || t('AI is unavailable right now.','الـAI مش متاحة دلوقتي.'))+'</strong>'
      +'<p class="velora-beauty-ai-copy">'+esc(t('Use the existing 3-question Beauty Passport instead.','استخدمي Beauty Passport بالـ3 أسئلة الموجودة بالفعل.'))+'</p>'
      +'<div class="velora-beauty-ai-actions"><button type="button" class="btn btn-primary" id="veloraBeautyAiManual">'+esc(t('Build my routine','ابني روتيني'))+'</button></div></div>';
    document.getElementById('veloraBeautyAiManual').addEventListener('click',openManualQuiz);
  }

  function renderCandidate(candidate) {
    const body=document.getElementById('veloraBeautyAiBody');
    if (candidate.decision === 'unsupported' || candidate.decision === 'unsafe') {
      renderFallback(candidate.decision === 'unsafe'
        ? t('This request needs a safer route.','الطلب ده محتاج مسار أكثر أمانًا.')
        : t('This request is outside the routine-intent flow.','الطلب ده خارج نطاق مساعدة بناء الروتين.'));
      return;
    }

    if (candidate.decision === 'needs_clarification') {
      const fields=candidate.missing_fields.map(function(field){return t(MISSING_LABELS[field]?.[0] || field, MISSING_LABELS[field]?.[1] || field);}).join(', ');
      body.innerHTML='<div class="velora-beauty-ai-result"><strong>'+esc(t('I need a little more detail.','محتاجين تفاصيل أكتر بسيطة.'))+'</strong>'
        +'<p class="velora-beauty-ai-copy">'+esc(t('Please provide: ','من فضلك وضّحي: ')+fields)+'</p>'
        +'<div class="velora-beauty-ai-actions"><button type="button" class="btn btn-primary" id="veloraBeautyAiEdit">'+esc(t('Edit my request','عدّلي كلامك'))+'</button>'
        +'<button type="button" class="btn btn-outline" id="veloraBeautyAiManual">'+esc(t('Use the 3 questions','استخدمي الـ3 أسئلة'))+'</button></div></div>';
      document.getElementById('veloraBeautyAiEdit').addEventListener('click',function(){renderInput('');});
      document.getElementById('veloraBeautyAiManual').addEventListener('click',openManualQuiz);
      return;
    }

    body.innerHTML='<div class="velora-beauty-ai-result"><strong>'+esc(t('Here is what I understood.','ده اللي فهمته منك.'))+'</strong>'
      +'<div class="velora-beauty-ai-grid">'
      +['skin_type','goal','routine_budget'].map(function(field){
        return '<div class="velora-beauty-ai-field"><span>'+esc(t(MISSING_LABELS[field][0],MISSING_LABELS[field][1]))+'</span><strong>'+esc(displayValue(field,candidate[field]))+'</strong></div>';
      }).join('')
      +'</div>'
      +'<p class="velora-beauty-ai-copy">'+esc(t('Confirm these answers and Velora will use the existing deterministic routine rules.','أكدي الإجابات دي وVelora هتستخدم قواعد الروتين الحالية المحددة مسبقًا.'))+'</p>'
      +'<div class="velora-beauty-ai-actions"><button type="button" class="btn btn-primary" id="veloraBeautyAiConfirm">'+esc(t('Use these answers','استخدمي الإجابات دي'))+'</button>'
      +'<button type="button" class="btn btn-outline" id="veloraBeautyAiEdit">'+esc(t('Edit manually','عدّلي يدويًا'))+'</button></div></div>';

    document.getElementById('veloraBeautyAiConfirm').addEventListener('click',function(){ void confirmCandidate(candidate); });
    document.getElementById('veloraBeautyAiEdit').addEventListener('click',openManualQuiz);
  }

  async function submit() {
    const input=document.getElementById('veloraBeautyAiInput');
    const text=String(input?.value || '').trim();
    if (!text) return;
    if (Array.from(text).length > MAX_INPUT_CHARS) {
      renderInput(t('Please keep the request under 800 characters.','خلي الطلب أقل من 800 حرف.'));
      return;
    }
    const button=document.getElementById('veloraBeautyAiSubmit');
    if (button) button.disabled=true;
    try {
      const client=getClient();
      const { data, error }=await client.functions.invoke('velora-beauty-ai-intent',{body:{text}});
      if (error) {
        renderFallback(t('AI is unavailable right now.','الـAI مش متاحة دلوقتي.'));
        return;
      }
      const candidate=validateCandidate(data);
      renderCandidate(candidate);
    } catch (error) {
      console.warn('[Velora Beauty AI] unavailable', error);
      renderFallback(t('AI is unavailable right now.','الـAI مش متاحة دلوقتي.'));
    } finally {
      if (button) button.disabled=false;
    }
  }

  async function confirmCandidate(candidate) {
    const api=window.veloraBeautyPassportV2;
    if (!api || typeof api.saveAnswersAndBuild !== 'function') {
      renderFallback(t('The routine flow is still loading. Please use the 3 questions.','مسار الروتين لسه بيحمّل. استخدمي الـ3 أسئلة.'));
      return;
    }
    try {
      await api.saveAnswersAndBuild({
        skin_type:candidate.skin_type,
        goal:candidate.goal,
        routine_budget:candidate.routine_budget
      });
      const modal=document.getElementById(ROOT_ID);
      if(modal) modal.classList.remove('active');
    } catch (error) {
      console.error('[Velora Beauty AI] confirm failed', error);
      renderFallback(t('We could not apply those answers. Please use the 3 questions instead.','مقدرتش نطبّق الإجابات دي. استخدمي الـ3 أسئلة بدل كده.'));
    }
  }

  function openManualQuiz() {
    const api=window.veloraBeautyPassportV2;
    if (api && typeof api.open === 'function') {
      api.open().catch(function(error){console.warn('[Velora Beauty AI] manual quiz failed',error);});
      return;
    }
    if (typeof window.openAuthModal === 'function') window.openAuthModal('login');
  }

  function open() {
    if (!hasUser()) {
      if (typeof window.openAuthModal === 'function') window.openAuthModal('login');
      else if (typeof window.handleAccountClick === 'function') window.handleAccountClick();
      return;
    }
    ensureStyle();
    const modal=ensureModal();
    setHeader();
    modal.classList.add('active');
    document.body.style.overflow='hidden';
    renderInput('');
  }

  function installEntry() {
    const host=document.querySelector('.hero-buttons');
    if (!host || document.getElementById('veloraBeautyAiEntry')) return;
    const button=document.createElement('button');
    button.id='veloraBeautyAiEntry';
    button.className='btn btn-outline btn-lg';
    button.type='button';
    button.textContent=t('Describe it your way','احكي بطريقتك');
    button.setAttribute('aria-label',t('Describe your beauty routine needs in your own words','احكي احتياجات روتينك بطريقتك'));
    button.addEventListener('click',open);
    host.appendChild(button);
  }

  window.veloraBeautyAI = Object.freeze({ open, validateCandidate });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded',installEntry,{once:true});
  } else {
    installEntry();
  }

  window.addEventListener('velora:languagechange',installEntry);
})();