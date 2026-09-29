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

  async function getRecommendations() {
    const client = getClient();
    const { data, error } = await client.rpc('velora_get_beauty_recommendations');

    if (error) throw error;
    if (!data || typeof data !== 'object') {
      throw new Error('BEAUTY_RECOMMENDATION_EMPTY_RESPONSE');
    }

    return data;
  }

  function t(en, ar) {
    return document.documentElement.lang === 'ar' ? ar : en;
  }

  function esc(value) {
    if (typeof window.escapeHtml === 'function') return window.escapeHtml(String(value == null ? '' : value));
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
    });
  }

  function reasonLabel(code) {
    const map = {
      goal_match: ['Goal match', 'مطابقة الهدف'],
      skin_type_match: ['Skin type match', 'مطابقة نوع البشرة'],
      feedback_positive: ['Positive feedback signal', 'إشارة من تقييم سابق'],
      budget_fit: ['Budget fit', 'داخل الميزانية'],
      availability_match: ['In stock', 'متاح حاليًا']
    };
    const pair = map[String(code || '')] || [String(code || 'Match'), String(code || 'مطابقة')];
    return t(pair[0], pair[1]);
  }

  function ensureStyles() {
    if (document.getElementById('veloraBeautyRecommendationsStyle')) return;
    const style = document.createElement('style');
    style.id = 'veloraBeautyRecommendationsStyle';
    style.textContent = [
      '#veloraBeautyRecommendationsSection .velora-recommendation-card{border:1px solid var(--border);border-radius:18px;background:var(--card);overflow:hidden;display:flex;flex-direction:column;min-width:0;}',
      '#veloraBeautyRecommendationsSection .velora-recommendation-media{aspect-ratio:1.15;background:var(--bg-alt);display:flex;align-items:center;justify-content:center;font-size:4rem;overflow:hidden;}',
      '#veloraBeautyRecommendationsSection .velora-recommendation-media img{width:100%;height:100%;object-fit:cover;display:block;}',
      '#veloraBeautyRecommendationsSection .velora-recommendation-body{padding:1rem;display:flex;flex-direction:column;gap:.45rem;min-height:0;}',
      '#veloraBeautyRecommendationsSection .velora-recommendation-brand{font-size:.78rem;color:var(--text-muted);}',
      '#veloraBeautyRecommendationsSection .velora-recommendation-name{font-weight:850;line-height:1.35;}',
      '#veloraBeautyRecommendationsSection .velora-recommendation-price{font-weight:900;margin-top:.15rem;}',
      '#veloraBeautyRecommendationsSection .velora-recommendation-reasons{display:flex;flex-wrap:wrap;gap:.35rem;margin-top:.2rem;}',
      '#veloraBeautyRecommendationsSection .velora-recommendation-reason{font-size:.67rem;padding:.28rem .45rem;border:1px solid var(--border);border-radius:999px;background:var(--bg-alt);}',
      '#veloraBeautyRecommendationsSection .velora-recommendation-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:auto;padding-top:.35rem;}',
      '#veloraBeautyRecommendationsSection .velora-recommendation-actions .btn{flex:1 1 120px;}',
      '@media(max-width:700px){#veloraBeautyRecommendationsSection .products-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;}#veloraBeautyRecommendationsSection .velora-recommendation-body{padding:.75rem}.velora-recommendation-actions .btn{min-height:44px;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function isHomeVisible() {
    const page = document.getElementById('page-home');
    return !!page && page.classList.contains('active');
  }

  function productExistsLocally(productId) {
    try {
      return Array.isArray(window.MAHA_DATA?.PRODUCTS) &&
        window.MAHA_DATA.PRODUCTS.some(function (p) { return String(p?.id) === String(productId); });
    } catch (_) {
      return false;
    }
  }

  function renderIncomplete() {
    const section = document.getElementById('veloraBeautyRecommendationsSection');
    const grid = document.getElementById('veloraBeautyRecommendationsGrid');
    const status = document.getElementById('veloraBeautyRecommendationsStatus');
    if (!section || !grid) return;
    ensureStyles();
    section.hidden = false;
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">✨</div><h3>' +
      esc(t('Complete your Beauty Passport first', 'كمّلي Beauty Passport الأول')) +
      '</h3><p>' +
      esc(t('Save your skin type, goal and routine budget to unlock personalized product picks.', 'احفظي نوع البشرة والهدف وميزانية الروتين علشان نطلعلك ترشيحات مخصصة.')) +
      '</p><button class="btn btn-primary" type="button" onclick="document.getElementById(\'veloraRoutineEntry\')?.click()">' +
      esc(t('Build my routine', 'ابني روتيني')) + '</button></div>';
    if (status) status.textContent = '';
  }

  function renderResponse(response) {
    const section = document.getElementById('veloraBeautyRecommendationsSection');
    const grid = document.getElementById('veloraBeautyRecommendationsGrid');
    const status = document.getElementById('veloraBeautyRecommendationsStatus');
    if (!section || !grid) return;
    ensureStyles();
    section.hidden = false;

    const state = String(response?.status || '');
    const items = Array.isArray(response?.recommendations) ? response.recommendations : [];

    if (state === 'incomplete') {
      renderIncomplete();
      return;
    }

    if (!items.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🪞</div><h3>' +
        esc(t('No personalized matches right now', 'مفيش ترشيحات مخصصة متاحة دلوقتي')) +
        '</h3><p>' +
        esc(t('Your Passport is complete, but there are no eligible stocked matches within its current rules.', 'الـPassport مكتمل، لكن مفيش منتجات مؤهلة وموجودة في المخزون مطابقة للقواعد الحالية.')) +
        '</p></div>';
      if (status) status.textContent = state === 'rate_limited'
        ? t('Please retry later.', 'جرّبي مرة تانية بعد شوية.')
        : '';
      return;
    }

    grid.innerHTML = items.map(function (item) {
      const p = item?.product || {};
      const v = item?.variant || null;
      const id = String(p.id || item.product_id || '');
      const imageUrl = String(p.image_url || '');
      const name = String(p.name || t('Beauty product', 'منتج عناية'));
      const brand = String(p.brand || '');
      const currency = String(p.currency_code || 'EGP');
      const price = Number(v?.price ?? p.price ?? 0);
      const reasons = Array.isArray(item?.reason_codes) ? item.reason_codes.slice(0, 5) : [];
      const canOpenLocal = productExistsLocally(id);
      const image = imageUrl
        ? '<img src="' + esc(imageUrl) + '" alt="' + esc(name) + '" loading="lazy" decoding="async">'
        : '<span aria-hidden="true">✨</span>';
      const openAction = canOpenLocal
        ? 'openProductDetail(\'' + esc(id) + '\')'
        : 'openMarketplaceCategory(\'beauty\')';
      const cartAction = canOpenLocal
        ? 'addToCart(\'' + esc(id) + '\')'
        : 'openMarketplaceCategory(\'beauty\')';

      return '<article class="velora-recommendation-card">' +
        '<div class="velora-recommendation-media">' + image + '</div>' +
        '<div class="velora-recommendation-body">' +
          '<div class="velora-recommendation-brand">' + esc(brand) + '</div>' +
          '<div class="velora-recommendation-name">' + esc(name) + (v?.name ? ' · ' + esc(v.name) : '') + '</div>' +
          '<div class="velora-recommendation-price">' + esc(price.toFixed(2)) + ' ' + esc(currency) + '</div>' +
          '<div class="velora-recommendation-reasons">' +
            reasons.map(function (reason) {
              return '<span class="velora-recommendation-reason">' + esc(reasonLabel(reason)) + '</span>';
            }).join('') +
          '</div>' +
          '<div class="velora-recommendation-actions">' +
            '<button class="btn btn-outline" type="button" onclick="' + openAction + '">' + esc(t('View product', 'عرض المنتج')) + '</button>' +
            '<button class="btn btn-primary" type="button" onclick="' + cartAction + '">' + esc(t('Add to cart', 'أضف للـCart')) + '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
    }).join('');

    if (status) {
      status.textContent = response?.run?.from_cache
        ? t('Loaded from your recent personalized result.', 'تم تحميل ترشيحاتك المخصصة الأخيرة.')
        : t('Built from your saved Beauty Passport and current catalog state.', 'اتعملت من Beauty Passport المحفوظة وحالة الكتالوج الحالية.');
    }
  }

  let lastRequestKey = '';
  let lastRequestAt = 0;
  let authBound = false;

  async function renderCurrentRecommendations(force) {
    const section = document.getElementById('veloraBeautyRecommendationsSection');
    if (!section || !isHomeVisible()) return null;

    const now = Date.now();
    if (!force && lastRequestKey && now - lastRequestAt < 60 * 1000) return null;

    try {
      const client = getClient();
      const sessionResult = await client.auth.getSession();
      const user = sessionResult?.data?.session?.user;
      if (!user) {
        section.hidden = true;
        return null;
      }

      lastRequestKey = String(user.id);
      lastRequestAt = now;
      const response = await getRecommendations();
      renderResponse(response);
      return response;
    } catch (error) {
      const code = String(error?.message || error || '');
      if (/AUTH_REQUIRED/i.test(code)) {
        section.hidden = true;
        return null;
      }
      const grid = document.getElementById('veloraBeautyRecommendationsGrid');
      const status = document.getElementById('veloraBeautyRecommendationsStatus');
      section.hidden = false;
      if (grid) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">⚠️</div><h3>' +
          esc(t('Recommendations unavailable', 'الترشيحات مش متاحة دلوقتي')) +
          '</h3></div>';
      }
      if (status) status.textContent = code;
      return null;
    }
  }

  function bindLifecycle() {
    if (authBound) return;
    authBound = true;

    const client = getClient();
    if (client.auth?.onAuthStateChange) {
      client.auth.onAuthStateChange(function () {
        setTimeout(function () { void renderCurrentRecommendations(true); }, 0);
      });
    }

    window.addEventListener('velora:passport-v2-updated', function () {
      lastRequestAt = 0;
      setTimeout(function () { void renderCurrentRecommendations(true); }, 0);
    });

    window.addEventListener('hashchange', function () {
      setTimeout(function () { void renderCurrentRecommendations(false); }, 0);
    });
  }

  async function init() {
    try {
      bindLifecycle();
      return await renderCurrentRecommendations(false);
    } catch (_) {
      return null;
    }
  }

  window.veloraBeautyRecommendations = Object.freeze({
    get: getRecommendations,
    render: renderCurrentRecommendations,
    init: init
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    void init();
  }
})();