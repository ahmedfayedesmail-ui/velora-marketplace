(function () {
  'use strict';

  /*
   * VELORA — Internal Beauty Intent Interpreter
   *
   * This is an internal service boundary, not a customer-facing AI product.
   * No button, modal, chat UI, AI label, prompt, or DOM mutation belongs here.
   *
   * Flow:
   * natural-language input -> server moderation -> strict structured intent
   * -> client/server contract validation -> caller decides whether/how to apply
   * -> existing Beauty Passport V2 / deterministic routine flow.
   *
   * This module never writes the database, selects products, changes commerce
   * state, or makes medical/diagnostic decisions.
   */

  const MAX_INPUT_CHARS = 800;
  const SKIN_TYPES = new Set(['oily','dry','combination','normal','sensitive','unknown']);
  const GOALS = new Set(['brightening','hydration','acne','anti-aging','oil']);
  const BUDGETS = new Set(['under_500','500_1000','1000_2000','over_2000','unknown']);
  const DECISIONS = new Set(['ready','needs_clarification','unsupported','unsafe']);
  const FIELDS = ['skin_type', 'goal', 'routine_budget'];

  function getClient() {
    const client = window.supabaseClient || window.mahaSupabase || null;
    if (!client || typeof client.functions?.invoke !== 'function') {
      throw new Error('SUPABASE_FUNCTIONS_UNAVAILABLE');
    }
    return client;
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
        if (fieldValue === null && !missing.includes(field)) {
          throw new Error('AI_CLARIFICATION_CONTRACT_INVALID');
        }
        if (fieldValue !== null && missing.includes(field)) {
          throw new Error('AI_CLARIFICATION_CONTRACT_INVALID');
        }
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

  async function interpret(input) {
    const text = String(input == null ? '' : input).trim();
    if (!text) throw new Error('AI_INPUT_EMPTY');
    if (Array.from(text).length > MAX_INPUT_CHARS) throw new Error('AI_INPUT_TOO_LONG');

    const client = getClient();
    const { data, error } = await client.functions.invoke('velora-beauty-ai-intent', {
      body: { text }
    });

    if (error) {
      throw new Error('AI_PROVIDER_UNAVAILABLE');
    }

    return validateCandidate(data);
  }

  window.veloraBeautyAI = Object.freeze({
    maxInputChars: MAX_INPUT_CHARS,
    validateCandidate,
    interpret
  });

  // Internal compatibility alias. Neither alias creates or exposes customer UI.
  window.veloraBeautyIntentInterpreter = window.veloraBeautyAI;
})();