(function () {
  'use strict';

  /*
   * VELORA — Internal, zero-cost Beauty Intent Interpreter
   *
   * This module is deliberately provider-free. It performs bounded semantic
   * intent extraction locally for the finite Beauty Passport V2 vocabulary.
   *
   * It does NOT:
   * - call OpenAI or another external model
   * - call Supabase or any network service
   * - create customer UI
   * - write the database
   * - choose products
   * - make medical or diagnostic decisions
   *
   * Flow:
   * natural-language input -> local intent extraction -> contract validation
   * -> caller confirmation -> existing Beauty Passport V2 -> deterministic routine.
   *
   * This design removes API-credit dependency from the customer path. The
   * vocabulary is intentionally finite, so deterministic semantic extraction
   * is the authoritative zero-cost path for these fields.
   */

  const MAX_INPUT_CHARS = 800;
  const SKIN_TYPES = new Set(['oily','dry','combination','normal','sensitive','unknown']);
  const GOALS = new Set(['brightening','hydration','acne','anti-aging','oil']);
  const BUDGETS = new Set(['under_500','500_1000','1000_2000','over_2000','unknown']);
  const DECISIONS = new Set(['ready','needs_clarification','unsupported','unsafe']);
  const FIELDS = ['skin_type', 'goal', 'routine_budget'];

  const SKIN_PATTERNS = {
    oily: [
      /\boily\b/i, /oily skin/i, /greasy/i, /shine|shiny|excess oil/i,
      /بشرة\s*(?:عاملة\s*)?(?:دهنية|زيتية)/i, /بشرتي\s*(?:دهنية|زيتية)/i, /بشرتي\s*(?:بتفرز|فيها)\s*(?:زيت|دهون)\s*كتير/i,
      /لمعان\s*(?:كتير|زيادة|زائد)/i, /زيوت\s*(?:كتير|زيادة|زائدة)/i
    ],
    dry: [
      /\bdry\b/i, /dry skin/i, /flaky|flaking/i,
      /بشرة\s*(?:عاملة\s*)?(?:جافة|ناشفة)/i, /بشرتي\s*(?:جافة|ناشفة)/i, /بشرتي\s*(?:بتنشف|بتشد|ناشفة|جافة)/i,
      /بتقشر/i, /تقشر\s*(?:البشرة|الوش|الوجه)/i
    ],
    combination: [
      /\bcombination\b/i, /combination skin/i,
      /بشرة\s*(?:مختلطة)/i, /مختلطة/i,
      /مناطق\s*(?:دهنية|زيتية).*?(?:جافة|ناشفة)/i, /(?:جافة|ناشفة).*?مناطق\s*(?:دهنية|زيتية)/i
    ],
    normal: [
      /\bnormal\b/i, /normal skin/i, /بشرة\s*(?:عادية|طبيعية)/i, /بشرتي\s*عادية/i
    ],
    sensitive: [
      /\bsensitive\b/i, /sensitive skin/i, /بشرة\s*حساسة/i, /بشرتي\s*حساسة/i
    ]
  };

  const GOAL_PATTERNS = {
    brightening: [
      /\bbrightening\b/i, /even[- ]looking skin/i, /glow/i,
      /تفتيح/i, /إشراقة|اشراقة|نضارة|منورة|مشرقة/i, /توحيد\s*(?:مظهر|لون)/i
    ],
    hydration: [
      /\bhydration\b/i, /hydrate|hydrating/i,
      /ترطيب/i, /مرطب|مرطبة/i, /بشرة\s*عطشانة/i
    ],
    acne: [
      /\bacne\b/i, /blemish|breakout/i,
      /حبوب/i, /حبة|حبوب|بثور/i, /بشرة\s*معرضة\s*للحبوب/i
    ],
    'anti-aging': [
      /anti[- ]?aging/i, /signs? of aging/i, /fine lines|wrinkles/i,
      /مكافحة\s*الشيخوخة/i, /علامات\s*تقدم\s*السن/i, /خطوط\s*(?:الوجه|البشرة)/i,
      /تجاعيد/i, /سنين|تقدم\s*العمر/i
    ],
    oil: [
      /reduce.*(?:oil|shine)/i, /excess oil/i, /oil control/i,
      /تقليل\s*(?:الزيوت|الدهون|اللمعان)/i, /التحكم\s*في\s*(?:الزيوت|الدهون)/i,
      /أقلل\s*(?:الزيوت|الدهون|اللمعان)/i, /عايزة\s*أقلل\s*(?:الزيوت|الدهون|اللمعان)/i
    ]
  };

  const UNSAFE_PATTERNS = [
    /diagnos(?:e|is|ing)/i, /prescrib/i, /dosage|dose|mg|medication/i,
    /دواء|دواءً|جرعة|جرعات|وصفة\s*طبية|علاج\s*طبي|تشخيص/i,
    /ضيق\s*تنفس|تورم\s*شديد|نزيف|حالة\s*طارئة|طوارئ/i
  ];

  const UNSUPPORTED_PATTERNS = [
    /ignore\s+(?:all\s+)?previous\s+instructions/i,
    /system\s+prompt|developer\s+message|jailbreak|prompt\s*injection/i,
    /تجاهل\s*(?:كل\s*)?(?:التعليمات|القواعد)\s*(?:السابقة|فوق)/i,
    /كود\s*خصم|coupon|seller|بائع|stock|مخزون|shipping|شحن|order|طلب\s*رقم/i
  ];

  const UNKNOWN_PATTERNS = [
    /i\s*(?:do not|don't)\s*know/i, /not\s* sure/i, /no idea/i,
    /مش\s*عارفة|مش\s*عارف|مش\s*متأكدة|مش\s*متاكد|معرفش|معرفتش/i,
    /مش\s*عارفة\s*نوع\s*بشرتي|مش\s*عارف\s*نوع\s*بشرتي/i
  ];

  const NUMBER_WORDS = [
    [/ألفين|الفين|اتنين\s*ألف|2000\s*جنيه/i, 2000],
    [/ألف\s*و?\s*(?:خمسمية|خمسمي[ي]ة)|الف\s*و?\s*(?:خمسمية|خمسمي[ي]ة)/i, 1500],
    [/ألف\s*و?\s*(?:سبعمية|سبعمي[ي]ة)|الف\s*و?\s*(?:سبعمية|سبعمي[ي]ة)/i, 1700],
    [/سبعمية|سبعمي[ي]ة/i, 700],
    [/خمسمية|خمسمي[ي]ة/i, 500],
    [/ألف|الف/i, 1000]
  ];

  function normalizeArabic(value) {
    return String(value || '')
      .normalize('NFKC')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[إأآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/٠/g, '0')
      .replace(/١/g, '1')
      .replace(/٢/g, '2')
      .replace(/٣/g, '3')
      .replace(/٤/g, '4')
      .replace(/٥/g, '5')
      .replace(/٦/g, '6')
      .replace(/٧/g, '7')
      .replace(/٨/g, '8')
      .replace(/٩/g, '9')
      .replace(/[،؛]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function hasMatch(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
  }

  function explicitlyUnknown(text, patterns = UNKNOWN_PATTERNS) {
    return hasMatch(text, patterns);
  }

  function collectUnique(matches) {
    return [...new Set(matches)];
  }

  function detectSkin(text) {
    if (
      /(?:دهنية|زيتية)/i.test(text) &&
      /(?:جافة|ناشفة)/i.test(text) &&
      /(?:بشر|skin|face|وش|وجه)/i.test(text)
    ) {
      return { value: 'combination', conflict: false };
    }

    const hits = [];
    for (const [value, patterns] of Object.entries(SKIN_PATTERNS)) {
      if (hasMatch(text, patterns)) {
        hits.push(value);
      }
    }

    if (explicitlyUnknown(text, [
      /skin\s*type/i,
      /نوع\s*بشرتي/i,
      /نوع\s*البشرة/i
    ]) && !hits.length) {
      return { value: 'unknown', conflict: false };
    }

    if (hits.length === 1) return { value: hits[0], conflict: false };
    if (hits.length > 1) {
      const normalizedHits = collectUnique(hits);
      if (normalizedHits.length === 2 && normalizedHits.includes('dry') && normalizedHits.includes('oily')) {
        return { value: null, conflict: true };
      }
      return { value: null, conflict: true };
    }
    return { value: null, conflict: false };
  }

  function detectGoal(text) {
    const hits = [];
    for (const [value, patterns] of Object.entries(GOAL_PATTERNS)) {
      if (hasMatch(text, patterns)) hits.push(value);
    }
    const unique = collectUnique(hits);
    if (unique.length === 1) return { value: unique[0], conflict: false };
    if (unique.length > 1) return { value: null, conflict: true };
    return { value: null, conflict: false };
  }

  function extractNumbers(text) {
    const nums = [];
    const numeric = /(?:^|[^0-9])(\d{2,6})(?:[.,]\\d{1,2})?(?=$|[^0-9])/g;
    let match;
    while ((match = numeric.exec(text))) nums.push(Number(match[1]));
    for (const [pattern, value] of NUMBER_WORDS) {
      if (pattern.test(text)) nums.push(value);
    }
    return nums;
  }

  function detectBudget(text) {
    if (explicitlyUnknown(text, [
      /budget/i, /ميزاني/i, /فلوس/i, /جنيه/i,
      /routine\s*budget/i, /ميزانية\s*الروتين/i
    ])) {
      const nums = extractNumbers(text);
      if (!nums.length && explicitlyUnknown(text)) return { value: 'unknown', conflict: false };
    }

    const nums = extractNumbers(text);
    const budgetMarkers = /budget|ميزاني|جنيه|egp|pounds?|روتين|routine/i;
    if (!nums.length && !budgetMarkers.test(text)) return { value: null, conflict: false };
    if (!nums.length && explicitlyUnknown(text)) return { value: 'unknown', conflict: false };
    if (!nums.length) return { value: null, conflict: false };

    const bands = nums
      .map((amount) => {
        if (amount < 500) return 'under_500';
        if (amount <= 1000) return '500_1000';
        if (amount <= 2000) return '1000_2000';
        return 'over_2000';
      });

    const unique = collectUnique(bands);
    if (unique.length > 1) return { value: null, conflict: true };
    return { value: unique[0], conflict: false };
  }

  function looksLikeBeautyIntent(text) {
    return hasMatch(text, [
      /skin|face|beauty|routine|skincare|serum|moistur|hydration|brightening|acne|blemish|glow/i,
      /بشر|بشرة|وش|وجه|روتين|سكين كير|العنايه|العناية|مرطب|سيروم|ترطيب|تفتيح|اشراقة|نضارة|حبوب|بثور|تجاعيد|ميزاني/i
    ]);
  }

  function toCandidate(input) {
    const original = String(input == null ? '' : input).trim();
    if (!original) throw new Error('AI_INPUT_EMPTY');
    if (Array.from(original).length > MAX_INPUT_CHARS) throw new Error('AI_INPUT_TOO_LONG');

    const text = normalizeArabic(original);

    if (hasMatch(text, UNSAFE_PATTERNS)) {
      return { decision: 'unsafe', skin_type: null, goal: null, routine_budget: null, missing_fields: [] };
    }

    if (hasMatch(text, UNSUPPORTED_PATTERNS)) {
      return { decision: 'unsupported', skin_type: null, goal: null, routine_budget: null, missing_fields: [] };
    }

    if (!looksLikeBeautyIntent(text)) {
      return { decision: 'unsupported', skin_type: null, goal: null, routine_budget: null, missing_fields: [] };
    }

    const skin = detectSkin(text);
    const goal = detectGoal(text);
    const budget = detectBudget(text);

    const conflicts = {
      skin_type: skin.conflict,
      goal: goal.conflict,
      routine_budget: budget.conflict
    };

    const missing = FIELDS.filter((field) => conflicts[field] || (
      field === 'skin_type' ? skin.value === null :
      field === 'goal' ? goal.value === null :
      budget.value === null
    ));

    if (!missing.length) {
      return {
        decision: 'ready',
        skin_type: skin.value,
        goal: goal.value,
        routine_budget: budget.value,
        missing_fields: []
      };
    }

    return {
      decision: 'needs_clarification',
      skin_type: conflicts.skin_type ? null : skin.value,
      goal: conflicts.goal ? null : goal.value,
      routine_budget: conflicts.routine_budget ? null : budget.value,
      missing_fields: missing
    };
  }

  function normalizeMissingFields(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value)];
  }

  function validateCandidate(candidate) {
    const value = candidate && typeof candidate === 'object' ? candidate : null;
    if (!value) throw new Error('AI_STRUCTURED_OUTPUT_INVALID');
    if (!DECISIONS.has(value.decision)) throw new Error('AI_DECISION_INVALID');

    const skin = value.skin_type == null ? null : value.skin_type;
    const goal = value.goal == null ? null : value.goal;
    const budget = value.routine_budget == null ? null : value.routine_budget;
    const missing = normalizeMissingFields(value.missing_fields);

    if (skin !== null && !SKIN_TYPES.has(skin)) throw new Error('AI_SKIN_TYPE_INVALID');
    if (goal !== null && !GOALS.has(goal)) throw new Error('AI_GOAL_INVALID');
    if (budget !== null && !BUDGETS.has(budget)) throw new Error('AI_BUDGET_INVALID');
    if (missing.some((field) => !FIELDS.includes(field))) throw new Error('AI_MISSING_FIELD_INVALID');

    if (value.decision === 'ready') {
      if (skin === null || goal === null || budget === null || missing.length) {
        throw new Error('AI_READY_CONTRACT_INVALID');
      }
    } else if (value.decision === 'needs_clarification') {
      if (!missing.length) throw new Error('AI_CLARIFICATION_CONTRACT_INVALID');
      FIELDS.forEach((field) => {
        const fieldValue = field === 'skin_type' ? skin : field === 'goal' ? goal : budget;
        if (fieldValue === null && !missing.includes(field)) throw new Error('AI_CLARIFICATION_CONTRACT_INVALID');
        if (fieldValue !== null && missing.includes(field)) throw new Error('AI_CLARIFICATION_CONTRACT_INVALID');
      });
    } else if (skin !== null || goal !== null || budget !== null || missing.length) {
      throw new Error('AI_NON_ACTIONABLE_CONTRACT_INVALID');
    }

    return Object.freeze({
      decision: value.decision,
      skin_type: skin,
      goal,
      routine_budget: budget,
      missing_fields: missing
    });
  }

  function interpret(input) {
    return validateCandidate(toCandidate(input));
  }

  window.veloraBeautyAI = Object.freeze({
    maxInputChars: MAX_INPUT_CHARS,
    validateCandidate,
    interpret
  });

  window.veloraBeautyIntentInterpreter = window.veloraBeautyAI;
})();
