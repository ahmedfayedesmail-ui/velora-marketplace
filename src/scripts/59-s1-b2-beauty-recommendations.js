/* ============================================================
   VELORA — Sprint 1 B2 Beauty Recommendation Operation
   Restore-Test/local implementation only.
   ============================================================ */
(function () {
  'use strict';

  function getClient() {
    const client = window.supabaseClient || window.mahaSupabase || null;
    if (!client || typeof client.rpc !== 'function') {
      throw new Error('Supabase client not available');
    }
    return client;
  }

  async function getRecommendations() {
    const client = getClient();
    const { data, error } = await client.rpc('velora_get_beauty_recommendations');

    if (error) throw error;
    if (!data || typeof data !== 'object') {
      throw new Error('BEAUTY_RECOMMENDATION_EMPTY_RESPONSE');
    }

    return data;
  }

  window.veloraBeautyRecommendations = Object.freeze({
    get: getRecommendations
  });
})();
