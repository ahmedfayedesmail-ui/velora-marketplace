/* ============================================================
   VELORA — Sprint 1 B1 Beauty Passport Persistence
   Restore-Test/local implementation only.
   ============================================================ */
(function () {
  'use strict';

  const QUIZ_VERSION = 'beauty-quiz.v1';
  const TABLE_FIELDS = [
    'user_id',
    'quiz_version',
    'goal',
    'concern',
    'texture_preference',
    'effect_preference',
    'avoidance_preferences',
    'shopping_priority',
    'updated_at'
  ];

  function getClient() {
    const client = window.supabaseClient || window.mahaSupabase || null;
    if (!client || typeof client.from !== 'function' || typeof client.rpc !== 'function') {
      throw new Error('Supabase client not available');
    }
    return client;
  }

  function normalizeOptional(value) {
    if (value === undefined || value === null) return null;
    const normalized = String(value).trim();
    return normalized === '' ? null : normalized;
  }

  function normalizeAvoidance(value) {
    if (value === undefined || value === null) return {};
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('INVALID_AVOIDANCE_PREFERENCES');
    }

    const allowedKeys = ['ingredients', 'tags'];
    const output = {};

    for (const key of Object.keys(value)) {
      if (!allowedKeys.includes(key)) {
        throw new Error('INVALID_AVOIDANCE_PREFERENCES');
      }

      const list = value[key];
      if (!Array.isArray(list) || list.some((item) => typeof item !== 'string')) {
        throw new Error('INVALID_AVOIDANCE_PREFERENCES');
      }

      const normalized = [...new Set(
        list.map((item) => item.trim()).filter(Boolean)
      )].sort();

      if (normalized.length) output[key] = normalized;
    }

    return output;
  }

  function normalizePayload(input) {
    const payload = input && typeof input === 'object' ? input : {};

    const quizVersion = normalizeOptional(payload.quiz_version) || QUIZ_VERSION;
    const goal = normalizeOptional(payload.goal);
    const concern = normalizeOptional(payload.concern);

    if (!goal || !concern) {
      throw new Error('PASSPORT_INCOMPLETE');
    }

    if (quizVersion !== QUIZ_VERSION) {
      throw new Error('UNSUPPORTED_QUIZ_VERSION');
    }

    return {
      p_quiz_version: quizVersion,
      p_goal: goal,
      p_concern: concern,
      p_texture_preference: normalizeOptional(payload.texture_preference),
      p_effect_preference: normalizeOptional(payload.effect_preference),
      p_avoidance_preferences: normalizeAvoidance(payload.avoidance_preferences),
      p_shopping_priority: normalizeOptional(payload.shopping_priority)
    };
  }

  async function get() {
    const client = getClient();
    const { data: authData, error: authError } = await client.auth.getUser();

    if (authError) throw authError;
    if (!authData || !authData.user) {
      return { status: 'unauthenticated', profile: null };
    }

    const { data, error } = await client
      .from('beauty_profiles')
      .select(TABLE_FIELDS.join(','))
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (error) throw error;

    return data
      ? { status: 'complete', profile: data }
      : { status: 'not_started', profile: null };
  }

  async function save(input) {
    const client = getClient();
    const args = normalizePayload(input);

    const { data, error } = await client.rpc('velora_save_beauty_profile', args);
    if (error) throw error;

    const profile = Array.isArray(data) ? data[0] : data;
    if (!profile) throw new Error('PASSPORT_SAVE_EMPTY');

    return {
      status: 'saved',
      profile
    };
  }

  window.veloraBeautyPassport = Object.freeze({
    quizVersion: QUIZ_VERSION,
    get,
    save
  });
})();
