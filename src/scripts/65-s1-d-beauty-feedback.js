/* ============================================================
   VELORA — Beauty Feedback / Experience capture
   Purchase-linked, DB-authoritative, idempotent.
   Restore-Test / staging only. Production remains frozen.
   ============================================================ */
(function () {
  'use strict';

  const getClient = () => window.mahaSupabase || window.supabaseClient || window.sb || null;

  function esc(value) {
    return typeof escapeHtml === 'function'
      ? escapeHtml(String(value ?? ''))
      : String(value ?? '').replace(/[&<>"']/g, (m) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
  }

  function currentUser() {
    const client = getClient();
    if (!client?.auth) throw new Error('SUPABASE_UNAVAILABLE');
    return client.auth.getUser().then((r) => {
      if (r.error) throw r.error;
      return r.data?.user || null;
    });
  }

  async function loadRecentPurchases() {
    const client = getClient();
    if (!client?.from) return [];
    const user = await currentUser();
    if (!user) return [];

    const { data, error } = await client
      .from('orders')
      .select('id,order_number,status,created_at,order_items(id,product_id,product_variant_id,product_name,quantity,unit_price)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data || []).flatMap((order) =>
      (order.order_items || []).map((item) => ({ ...item, order_number: order.order_number, order_status: order.status, order_created_at: order.created_at }))
    ).slice(0, 12);
  }

  async function loadExistingFeedback() {
    const client = getClient();
    if (!client?.from) return new Map();
    const user = await currentUser();
    if (!user) return new Map();

    const { data, error } = await client
      .from('beauty_feedback')
      .select('id,order_item_id,rating,texture,effect,moderation_status,created_at')
      .eq('user_id', user.id)
      .not('order_item_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return new Map((data || []).map((row) => [row.order_item_id, row]));
  }

  function productMeta(productId) {
    return (window.MAHA_DATA?.PRODUCTS || []).find((p) => String(p.id) === String(productId)) || {};
  }

  function modalHtml(item) {
    const p = productMeta(item.product_id);
    const key = 'beauty-feedback-' + item.id;
    return '<div class="modal-content velora-feedback-modal">' +
      '<div class="modal-header">' +
        '<h2>💗 Share your product experience</h2>' +
        '<button class="modal-close" type="button" data-velora-feedback-close>✕</button>' +
      '</div>' +
      '<div class="velora-feedback-product">' +
        '<span>' + esc(p.emoji || '📦') + '</span>' +
        '<div><strong>' + esc(item.product_name || p.name || 'Product') + '</strong>' +
        '<div class="velora-feedback-muted">Order #' + esc(item.order_number) + '</div></div>' +
      '</div>' +
      '<form id="veloraBeautyFeedbackForm">' +
        '<input type="hidden" id="veloraFeedbackProductId" value="' + esc(item.product_id) + '">' +
        '<input type="hidden" id="veloraFeedbackVariantId" value="' + esc(item.product_variant_id || '') + '">' +
        '<input type="hidden" id="veloraFeedbackOrderItemId" value="' + esc(item.id) + '">' +
        '<input type="hidden" id="veloraFeedbackIdempotency" value="' + esc(key) + '">' +
        '<div class="form-group"><label>Rating *</label>' +
          '<div id="veloraFeedbackRating" class="velora-feedback-stars">' +
            [1,2,3,4,5].map((n) => '<button type="button" data-rating="' + n + '" aria-label="' + n + ' stars">★</button>').join('') +
          '</div>' +
        '</div>' +
        '<div class="form-group"><label for="veloraFeedbackTexture">How did it feel? *</label>' +
          '<select id="veloraFeedbackTexture" class="form-input" required>' +
            '<option value="">Select texture</option>' +
            '<option value="light">Light</option>' +
            '<option value="balanced">Balanced</option>' +
            '<option value="rich">Rich</option>' +
            '<option value="sticky">Sticky</option>' +
            '<option value="greasy">Greasy</option>' +
            '<option value="drying">Drying</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-group"><label for="veloraFeedbackEffect">How did it perform for you? *</label>' +
          '<select id="veloraFeedbackEffect" class="form-input" required>' +
            '<option value="">Select effect</option>' +
            '<option value="helpful">Helpful</option>' +
            '<option value="neutral">Neutral</option>' +
            '<option value="not_helpful">Not helpful</option>' +
            '<option value="too_heavy">Too heavy</option>' +
            '<option value="irritating">Irritating</option>' +
          '</select>' +
        '</div>' +
        '<p class="velora-feedback-note">This experience is stored with your product purchase and can later be used as a signal for future routine refinement. It is not a medical assessment.</p>' +
        '<button class="btn btn-primary btn-block btn-lg" type="submit">Save my experience</button>' +
      '</form>' +
    '</div>';
  }

  function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
      document.body.style.overflow = '';
    }, 120);
  }

  async function openFeedback(item) {
    const modal = document.createElement('div');
    modal.id = 'veloraBeautyFeedbackModal';
    modal.className = 'modal';
    modal.innerHTML = modalHtml(item);
    document.body.appendChild(modal);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    let chosen = 5;
    const paint = () => modal.querySelectorAll('#veloraFeedbackRating button').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.rating) <= chosen);
    });
    modal.querySelectorAll('#veloraFeedbackRating button').forEach((b) => {
      b.addEventListener('click', () => { chosen = Number(b.dataset.rating); paint(); });
    });
    paint();

    modal.querySelector('[data-velora-feedback-close]').addEventListener('click', () => closeModal(modal));

    modal.querySelector('#veloraBeautyFeedbackForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = event.submitter;
      if (submit) submit.disabled = true;

      try {
        const client = getClient();
        const payload = {
          p_product_id: modal.querySelector('#veloraFeedbackProductId').value,
          p_product_variant_id: modal.querySelector('#veloraFeedbackVariantId').value || null,
          p_order_item_id: modal.querySelector('#veloraFeedbackOrderItemId').value,
          p_rating: chosen,
          p_texture: modal.querySelector('#veloraFeedbackTexture').value,
          p_effect: modal.querySelector('#veloraFeedbackEffect').value,
          p_source: 'purchase',
          p_idempotency_key: modal.querySelector('#veloraFeedbackIdempotency').value
        };

        const { data, error } = await client.rpc('velora_submit_beauty_feedback', payload);
        if (error) throw error;
        if (!data?.ok) throw new Error('Feedback was not accepted by the server.');

        closeModal(modal);
        if (typeof showToast === 'function') {
          showToast('✅ Experience saved to your Beauty Journey.', 'success');
        }
        window.dispatchEvent(new CustomEvent('velora:feedback-updated'));
        await mount();
      } catch (error) {
        console.error('Velora Beauty Feedback error:', error);
        if (typeof showToast === 'function') {
          showToast('❌ ' + (error.message || error), 'error');
        }
        if (submit) submit.disabled = false;
      }
    });
  }

  function ensureStyles() {
    if (document.getElementById('veloraBeautyFeedbackStyle')) return;
    const style = document.createElement('style');
    style.id = 'veloraBeautyFeedbackStyle';
    style.textContent = [
      '.velora-feedback-modal{max-width:620px;}',
      '.velora-feedback-product{display:flex;gap:.8rem;align-items:center;padding:.85rem;border:1px solid var(--border);border-radius:16px;background:var(--bg-alt);margin-bottom:1rem;}',
      '.velora-feedback-product>span{font-size:2rem;}',
      '.velora-feedback-muted,.velora-feedback-note{color:var(--text-muted);font-size:.85rem;}',
      '.velora-feedback-stars{display:flex;gap:.3rem;}',
      '.velora-feedback-stars button{border:0;background:transparent;color:var(--text-muted);font-size:2rem;cursor:pointer;padding:.15rem .25rem;}',
      '.velora-feedback-stars button.active{color:var(--primary);}',
      '.velora-experience-list{display:grid;gap:.55rem;margin-top:.75rem;}',
      '.velora-experience-item{display:flex;justify-content:space-between;gap:.8rem;align-items:center;padding:.8rem;border:1px solid var(--border);border-radius:15px;background:var(--bg-alt);}',
      '.velora-experience-info{min-width:0;}',
      '.velora-experience-info strong{display:block;}',
      '.velora-experience-meta{font-size:.75rem;color:var(--text-muted);margin-top:.2rem;}',
      '.velora-experience-item .btn{white-space:nowrap;}',
      '@media(max-width:700px){.velora-experience-item{align-items:flex-start;flex-direction:column}.velora-experience-item .btn{width:100%}}'
    ].join('');
    document.head.appendChild(style);
  }

  async function mount() {
    const account = document.getElementById('accountContent');
    const page = document.getElementById('page-account');
    if (!account || !page?.classList.contains('active')) return;

    let host = document.getElementById('veloraBeautyExperience');
    if (!host) {
      host = document.createElement('div');
      host.id = 'veloraBeautyExperience';
      account.appendChild(host);
    }

    ensureStyles();
    host.innerHTML =
      '<section class="velora-journey-card">' +
        '<div class="velora-journey-kicker">YOUR BEAUTY EXPERIENCE</div>' +
        '<h2>Products from your orders</h2>' +
        '<p class="velora-journey-muted">Tell Velora what worked for you. These signals are kept separate from public reviews.</p>' +
        '<div class="velora-experience-list" data-velora-experience-list><div class="velora-journey-loading">Loading products…</div></div>' +
      '</section>';

    try {
      const [items, feedback] = await Promise.all([loadRecentPurchases(), loadExistingFeedback()]);
      const list = host.querySelector('[data-velora-experience-list]');
      if (!items.length) {
        list.innerHTML = '<div class="velora-journey-muted">Your purchased products will appear here.</div>';
        return;
      }

      list.innerHTML = items.map((item) => {
        const p = productMeta(item.product_id);
        const existing = feedback.get(item.id);
        const label = existing
          ? 'Saved · ' + String(existing.moderation_status || 'pending')
          : 'Share experience';
        return '<div class="velora-experience-item">' +
          '<div class="velora-experience-info">' +
            '<strong>' + esc(item.product_name || p.name || 'Product') + '</strong>' +
            '<div class="velora-experience-meta">Order #' + esc(item.order_number) + ' · Qty ' + esc(item.quantity) + ' · ' + esc(item.order_status) + '</div>' +
            (existing ? '<div class="velora-experience-meta">Rating ' + esc(existing.rating) + '/5 · ' + esc(existing.texture) + ' · ' + esc(existing.effect) + '</div>' : '') +
          '</div>' +
          '<button class="btn btn-' + (existing ? 'outline' : 'primary') + '" type="button" data-feedback-item="' + esc(item.id) + '" ' + (existing ? 'disabled' : '') + '>' + label + '</button>' +
        '</div>';
      }).join('');

      list.querySelectorAll('[data-feedback-item]').forEach((button) => {
        const item = items.find((row) => String(row.id) === String(button.dataset.feedbackItem));
        if (item) button.addEventListener('click', () => openFeedback(item));
      });
    } catch (error) {
      host.querySelector('[data-velora-experience-list]').innerHTML =
        '<div class="velora-journey-muted">We could not load your product experience panel.</div>';
      console.error('Velora Beauty Experience load error:', error);
    }
  }

  const originalNavigateTo = window.navigateTo;
  if (typeof originalNavigateTo === 'function') {
    window.navigateTo = function(page) {
      const result = originalNavigateTo.apply(this, arguments);
      if (page === 'account') setTimeout(() => mount().catch(() => {}), 0);
      return result;
    };
  }
  window.addEventListener('velora:passport-v2-updated', () => mount().catch(() => {}));
  window.addEventListener('hashchange', () => mount().catch(() => {}));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mount().catch(() => {}), { once: true });
  } else {
    setTimeout(() => mount().catch(() => {}), 350);
  }

  console.log('✅ Velora Beauty Feedback surface loaded');
})();