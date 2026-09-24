/* ============================================================
   VELORA — Beauty Feedback Moderation
   Staff-only queue. Public reviews remain separate.
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

  function addNav() {
    const nav = document.querySelector('#adminPlatform .admin-nav');
    if (!nav || nav.querySelector('[data-velora-beauty-feedback-nav]')) return;

    const section = document.createElement('div');
    section.className = 'admin-nav-section';
    section.innerHTML =
      '<div class="admin-nav-title">Beauty Journey</div>' +
      '<div class="admin-nav-item" data-velora-beauty-feedback-nav>' +
        '<span>💗</span><span>Beauty Feedback</span>' +
      '</div>';

    const item = section.querySelector('[data-velora-beauty-feedback-nav]');
    item.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav-item').forEach((x) => x.classList.remove('active'));
      item.classList.add('active');
      const title = document.getElementById('adminHeaderTitle');
      if (title) title.textContent = 'Beauty Feedback';
      renderQueue('pending').catch((error) => renderError(error));
    });

    nav.appendChild(section);
  }

  async function fetchQueue(status) {
    const client = getClient();
    if (!client?.from || !client?.auth) throw new Error('SUPABASE_UNAVAILABLE');

    const auth = await client.auth.getUser();
    if (auth.error) throw auth.error;
    if (!auth.data?.user) throw new Error('AUTH_REQUIRED');

    const result = await client
      .from('beauty_feedback')
      .select(
        'id,user_id,product_id,product_variant_id,order_item_id,rating,texture,effect,source,moderation_status,moderation_note,created_at,' +
        'products(name,brand),' +
        'order_items(product_name,order_id,product_variant_name)'
      )
      .eq('moderation_status', status)
      .order('created_at', { ascending: false })
      .limit(100);

    if (result.error) throw result.error;
    return result.data || [];
  }

  function renderError(error) {
    const host = document.getElementById('adminContent');
    if (!host) return;
    host.innerHTML =
      '<section class="velora-feedback-admin-card">' +
        '<h2>Beauty Feedback</h2>' +
        '<div class="velora-feedback-admin-error">Could not load feedback: ' +
          esc(error?.message || error) + '</div>' +
      '</section>';
  }

  function renderQueue(status) {
    const host = document.getElementById('adminContent');
    if (!host) return Promise.resolve();

    host.innerHTML =
      '<section class="velora-feedback-admin-card">' +
        '<div class="velora-feedback-admin-head">' +
          '<div><div class="velora-feedback-admin-kicker">BEAUTY JOURNEY</div>' +
          '<h2>Beauty Feedback Moderation</h2>' +
          '<p>Customer experience signals are private to the journey and only approved feedback can influence future routines.</p></div>' +
          '<select id="veloraBeautyFeedbackStatus" class="form-input" style="max-width:180px">' +
            '<option value="pending">Pending</option>' +
            '<option value="approved">Approved</option>' +
            '<option value="rejected">Rejected</option>' +
          '</select>' +
        '</div>' +
        '<div id="veloraBeautyFeedbackQueue">Loading…</div>' +
      '</section>';

    const select = document.getElementById('veloraBeautyFeedbackStatus');
    if (select) {
      select.value = status;
      select.addEventListener('change', () => renderQueue(select.value).catch(renderError));
    }

    return fetchQueue(status).then((rows) => {
      const queue = document.getElementById('veloraBeautyFeedbackQueue');
      if (!queue) return;

      if (!rows.length) {
        queue.innerHTML = '<div class="velora-feedback-admin-empty">No ' + esc(status) + ' feedback.</div>';
        return;
      }

      queue.innerHTML = rows.map((row) => {
        const product = row.products || {};
        const orderItem = row.order_items || {};
        return '<article class="velora-feedback-admin-item" data-feedback-id="' + esc(row.id) + '">' +
          '<div class="velora-feedback-admin-top">' +
            '<div><strong>' + esc(product.name || orderItem.product_name || 'Product') + '</strong>' +
            '<div class="velora-feedback-admin-meta">' +
              (product.brand ? esc(product.brand) + ' · ' : '') +
              (row.order_item_id ? 'Order item linked' : 'Product interaction') +
            '</div></div>' +
            '<span class="velora-feedback-admin-pill">' + esc(row.moderation_status) + '</span>' +
          '</div>' +
          '<div class="velora-feedback-admin-grid">' +
            '<div><span>Rating</span><strong>' + esc(row.rating) + '/5</strong></div>' +
            '<div><span>Texture</span><strong>' + esc(row.texture) + '</strong></div>' +
            '<div><span>Effect</span><strong>' + esc(row.effect) + '</strong></div>' +
            '<div><span>Created</span><strong>' + esc(new Date(row.created_at).toLocaleString()) + '</strong></div>' +
          '</div>' +
          '<div class="velora-feedback-admin-actions">' +
            '<button class="btn btn-primary" data-feedback-status="approved">Approve</button>' +
            '<button class="btn btn-outline" data-feedback-status="rejected">Reject</button>' +
            '<button class="btn btn-outline" data-feedback-status="pending">Keep pending</button>' +
          '</div>' +
        '</article>';
      }).join('');

      queue.querySelectorAll('[data-feedback-status]').forEach((button) => {
        button.addEventListener('click', async () => {
          const card = button.closest('[data-feedback-id]');
          if (!card) return;
          button.disabled = true;

          try {
            const client = getClient();
            const note = rowNote(card);
            const result = await client.rpc('velora_moderate_beauty_feedback', {
              p_feedback_id: card.dataset.feedbackId,
              p_status: button.dataset.feedbackStatus,
              p_note: note || null
            });
            if (result.error) throw result.error;
            if (typeof showToast === 'function') {
              showToast('✅ Beauty feedback status updated.', 'success');
            }
            await renderQueue(status);
          } catch (error) {
            button.disabled = false;
            if (typeof showToast === 'function') {
              showToast('❌ ' + (error.message || error), 'error');
            }
          }
        });
      });
    });
  }

  function rowNote(card) {
    const input = card.querySelector('[data-feedback-note]');
    return input?.value?.trim() || '';
  }

  function ensureStyles() {
    if (document.getElementById('veloraBeautyFeedbackAdminStyle')) return;
    const style = document.createElement('style');
    style.id = 'veloraBeautyFeedbackAdminStyle';
    style.textContent = [
      '.velora-feedback-admin-card{padding:1.1rem;border:1px solid var(--border);border-radius:22px;background:var(--card);}',
      '.velora-feedback-admin-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;margin-bottom:1rem;}',
      '.velora-feedback-admin-kicker{font-size:.72rem;letter-spacing:.08em;font-weight:850;color:var(--primary);}',
      '.velora-feedback-admin-head p{color:var(--text-muted);margin-top:.35rem;}',
      '.velora-feedback-admin-item{padding:1rem;border:1px solid var(--border);border-radius:16px;background:var(--bg-alt);margin:.7rem 0;}',
      '.velora-feedback-admin-top{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;}',
      '.velora-feedback-admin-meta{font-size:.8rem;color:var(--text-muted);margin-top:.2rem;}',
      '.velora-feedback-admin-pill{font-size:.72rem;font-weight:800;padding:.3rem .55rem;border-radius:999px;border:1px solid var(--border);}',
      '.velora-feedback-admin-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.6rem;margin-top:.8rem;}',
      '.velora-feedback-admin-grid>div{padding:.65rem .75rem;border:1px solid var(--border);border-radius:12px;background:var(--card);}',
      '.velora-feedback-admin-grid span{display:block;font-size:.72rem;color:var(--text-muted);}',
      '.velora-feedback-admin-grid strong{display:block;margin-top:.18rem;}',
      '.velora-feedback-admin-actions{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.85rem;}',
      '.velora-feedback-admin-empty,.velora-feedback-admin-error{padding:1rem;color:var(--text-muted);}',
      '@media(max-width:700px){.velora-feedback-admin-head{flex-direction:column}.velora-feedback-admin-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.velora-feedback-admin-actions .btn{flex:1 1 100%;}}'
    ].join('');
    document.head.appendChild(style);
  }

  function init() {
    ensureStyles();
    addNav();

    const platform = document.getElementById('adminPlatform');
    if (platform && typeof MutationObserver === 'function') {
      const observer = new MutationObserver(() => addNav());
      observer.observe(platform, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  setTimeout(addNav, 900);
  setTimeout(addNav, 1800);

  window.VELORA_RENDER_BEAUTY_FEEDBACK_QUEUE = renderQueue;

  console.log('✅ Velora Beauty Feedback moderation loaded');
})();