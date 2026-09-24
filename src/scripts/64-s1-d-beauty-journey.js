/* ============================================================
   VELORA — Beauty Journey / Passport Memory surface
   Source of truth: beauty_profiles + latest beauty_routine_runs.
   No new persistence contract; Restore-Test / staging only.
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

  function isAccountPageVisible() {
    const page = document.getElementById('page-account');
    return !!page && page.classList.contains('active');
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  }

  async function loadJourney() {
    const client = getClient();
    if (!client?.rpc || !client?.auth) return null;

    const auth = await client.auth.getUser();
    if (auth.error || !auth.data?.user) return null;

    const [journeyResult, replenishmentResult] = await Promise.all([
      client.rpc('velora_get_current_beauty_routine'),
      client.rpc('velora_get_replenishment_signals')
    ]);

    if (journeyResult.error) throw journeyResult.error;
    if (replenishmentResult.error) throw replenishmentResult.error;

    const journey = journeyResult.data || {};
    const replenishment = replenishmentResult.data || {};

    return {
      profile: journey.profile || null,
      routine: journey.routine || null,
      routines: Array.isArray(journey.routines) ? journey.routines : [],
      steps: Array.isArray(journey.steps) ? journey.steps : [],
      context: journey.context || null,
      refreshed: !!journey.refreshed,
      replenishmentSignals: Array.isArray(replenishment.signals) ? replenishment.signals : []
    };
  }

  function renderSkeleton(host) {
    host.innerHTML =
      '<section class="velora-journey-card">' +
        '<div class="velora-journey-head">' +
          '<div><div class="velora-journey-kicker">VELORA BEAUTY JOURNEY</div>' +
          '<h2>My Beauty Journey</h2>' +
          '<p class="velora-journey-muted">Your Passport and latest routine, kept together.</p></div>' +
        '</div>' +
        '<div class="velora-journey-loading">Loading your beauty journey…</div>' +
      '</section>';
  }

  function renderEmpty(host) {
    host.innerHTML =
      '<section class="velora-journey-card">' +
        '<div class="velora-journey-kicker">VELORA BEAUTY JOURNEY</div>' +
        '<h2>My Beauty Journey</h2>' +
        '<p class="velora-journey-muted">Your saved Passport will become the memory layer for your routines.</p>' +
        '<button type="button" class="btn btn-primary" data-velora-journey-action="passport">Open my Passport</button>' +
      '</section>';
  }

  function render(host, data) {
    const profile = data?.profile;
    const routine = data?.routine;
    const selectedSteps = (data?.steps || []).filter(
      (step) => step.selection_status === 'selected' && step.product_id
    );

    host.innerHTML =
      '<section class="velora-journey-card">' +
        '<div class="velora-journey-head">' +
          '<div>' +
            '<div class="velora-journey-kicker">VELORA BEAUTY JOURNEY</div>' +
            '<h2>My Beauty Journey</h2>' +
            '<p class="velora-journey-muted">Your Passport is the memory. Your routine is the current plan.</p>' +
          '</div>' +
          '<span class="velora-journey-v2">V2</span>' +
        '</div>' +
        '<div class="velora-journey-grid">' +
          '<div class="velora-journey-panel">' +
            '<div class="velora-journey-label">Passport</div>' +
            '<div class="velora-journey-row"><span>Skin</span><strong>' + esc(profile?.skin_type || '—') + '</strong></div>' +
            '<div class="velora-journey-row"><span>Goal</span><strong>' + esc(profile?.goal || '—') + '</strong></div>' +
            '<div class="velora-journey-row"><span>Budget</span><strong>' + esc(profile?.routine_budget || '—') + '</strong></div>' +
            '<div class="velora-journey-date">Updated ' + esc(formatDate(profile?.updated_at)) + '</div>' +
            '<button type="button" class="btn btn-outline" data-velora-journey-action="passport">Edit my Passport</button>' +
          '</div>' +
          '<div class="velora-journey-panel">' +
            '<div class="velora-journey-label">Latest Routine</div>' +
            '<div class="velora-journey-row"><span>Status</span><strong>' + esc(routine?.status || 'No routine yet') + '</strong></div>' +
            '<div class="velora-journey-row"><span>Steps selected</span><strong>' + selectedSteps.length + '</strong></div>' +
            '<div class="velora-journey-row"><span>Season</span><strong>' + esc(data.context?.season || '—') + '</strong></div>' +
            '<div class="velora-journey-row"><span>Ruleset</span><strong>' + esc(routine?.ruleset_version || '—') + '</strong></div>' +
            '<div class="velora-journey-date">Created ' + esc(formatDate(routine?.created_at)) + (data.refreshed ? ' · refreshed for current context' : '') + '</div>' +
            '<button type="button" class="btn btn-primary" data-velora-journey-action="routine" ' +
              (routine ? '' : 'disabled') + '>Open my routine</button>' +
          '</div>' +
        '</div>' +
        '<div class="velora-journey-history">' +
          '<div class="velora-journey-history-row">' +
            '<div>' +
              '<div class="velora-journey-label">Routine History</div>' +
              '<div class="velora-journey-muted">' + (data.routines && data.routines.length > 1
                ? (data.routines.length - 1) + ' previous routine' + ((data.routines.length - 1) === 1 ? '' : 's') + ' saved'
                : 'No previous routines yet.') + '</div>' +
            '</div>' +
            (data.routines && data.routines.length > 1
              ? '<button type="button" class="btn btn-outline btn-sm" data-velora-history-open>View history</button>'
              : '') +
          '</div>' +
        '</div>' +
        '<div class="velora-journey-history" data-velora-replenishment>' +
          '<div class="velora-journey-history-row">' +
            '<div>' +
              '<div class="velora-journey-label">Replenishment</div>' +
              '<div class="velora-journey-muted">' +
                (data.replenishmentSignals.length
                  ? data.replenishmentSignals.filter((x) => x.status === 'due').length + ' due · ' +
                    data.replenishmentSignals.filter((x) => x.status === 'upcoming').length + ' upcoming'
                  : 'No replenishment signals yet.') +
              '</div>' +
            '</div>' +
          '</div>' +
          (data.replenishmentSignals.length
            ? '<div class="velora-journey-history-list">' +
              data.replenishmentSignals.slice(0, 4).map((x) =>
                '<div class="velora-journey-history-item">' +
                  '<div><strong>' + esc(x.product_name || 'Product') + '</strong>' +
                  '<div class="velora-journey-muted">' +
                    esc(x.status) + ' · ' + esc(Math.max(0, Math.ceil(Number(x.days_until_due || 0)))) + ' days' +
                  '</div></div>' +
                  '<span>' + esc(formatDate(x.next_replenishment_at)) + '</span>' +
                '</div>'
              ).join('') +
              '</div>'
            : '') +
        '</div>' +
        '<div class="velora-journey-footer">'
          '<span>Your Passport is the memory. Your current routine stays in focus; history is available when you need it.</span>' +
        '</div>' +
      '</section>';

    host.querySelectorAll('[data-velora-journey-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const action = button.dataset.veloraJourneyAction;
        if (action === 'routine') {
          if (window.veloraRoutineUX?.open) {
            await window.veloraRoutineUX.open();
          }
          return;
        }
        if (action === 'passport' && window.veloraBeautyPassportV2?.open) {
          await window.veloraBeautyPassportV2.open();
        }
      });
    });
    
    const historyButton = host.querySelector('[data-velora-history-open]');
    if (historyButton) {
      historyButton.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'veloraRoutineHistoryModal';
        modal.innerHTML =
          '<div class="modal-content velora-history-modal">' +
            '<div class="modal-header">' +
              '<h2>Routine History</h2>' +
              '<button class="modal-close" type="button" data-history-close>✕</button>' +
            '</div>' +
            '<p class="velora-journey-muted">Your saved routine runs stay available without taking space on the main account page.</p>' +
            '<div class="velora-journey-history-list">' +
              (data.routines || []).map((run, index) =>
                '<div class="velora-journey-history-item">' +
                  '<div><strong>' + (index === 0 ? 'Current routine' : 'Routine ' + (index + 1)) + '</strong>' +
                  '<div class="velora-journey-muted">' + esc(formatDate(run.created_at)) + ' · ' + esc(run.status) + '</div></div>' +
                  '<span>' + esc(run.ruleset_version || '—') + '</span>' +
                '</div>'
              ).join('') +
            '</div>' +
          '</div>';
        document.body.appendChild(modal);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        modal.querySelector('[data-history-close]').addEventListener('click', () => {
          modal.classList.remove('active');
          setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
          }, 120);
        });
      });
    }
  }

  function ensureStyles() {
    if (document.getElementById('veloraBeautyJourneyStyle')) return;
    const style = document.createElement('style');
    style.id = 'veloraBeautyJourneyStyle';
    style.textContent = [
      '.velora-journey-card{margin:1.25rem 0;padding:1.1rem;border:1px solid var(--border);border-radius:24px;background:var(--card);box-shadow:var(--shadow-sm);}',
      '.velora-journey-head{display:flex;justify-content:space-between;gap:1rem;align-items:flex-start;}',
      '.velora-journey-kicker{font-size:.72rem;font-weight:850;letter-spacing:.09em;color:var(--primary);text-transform:uppercase;}',
      '.velora-journey-card h2{margin:.2rem 0 .25rem;}',
      '.velora-journey-muted,.velora-journey-date{color:var(--text-muted);}',
      '.velora-journey-v2{border:1px solid var(--border);padding:.35rem .65rem;border-radius:999px;font-weight:800;}',
      '.velora-journey-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;margin-top:1rem;}',
      '.velora-journey-panel{padding:.95rem;border:1px solid var(--border);border-radius:18px;background:var(--bg-alt);}',
      '.velora-journey-label{font-weight:850;margin-bottom:.7rem;}',
      '.velora-journey-row{display:flex;justify-content:space-between;gap:.8rem;padding:.38rem 0;border-bottom:1px solid var(--border);}',
      '.velora-journey-row:last-of-type{border-bottom:0;}',
      '.velora-journey-row strong{text-align:end;}',
      '.velora-journey-date{font-size:.78rem;margin:.7rem 0;}',
      '.velora-journey-history{margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border);}',      '.velora-journey-history-row{display:flex;justify-content:space-between;gap:.8rem;align-items:center;}',      '.velora-journey-history-list{display:grid;gap:.45rem;margin-top:.9rem;}',      '.velora-journey-history-item{display:flex;justify-content:space-between;gap:.8rem;align-items:center;padding:.7rem .8rem;border:1px solid var(--border);border-radius:14px;background:var(--bg-alt);}',      '.velora-journey-history-item span{font-size:.75rem;font-weight:750;color:var(--text-muted);text-align:right;}',      '.velora-history-modal{max-width:680px;}',      '.velora-journey-footer{margin-top:.8rem;padding-top:.8rem;border-top:1px solid var(--border);font-size:.82rem;color:var(--text-muted);}',
      '.velora-journey-loading{padding:1rem 0;color:var(--text-muted);}',
      '@media(max-width:700px){.velora-journey-grid{grid-template-columns:1fr}.velora-journey-head{gap:.5rem}.velora-journey-card{border-radius:18px;padding:.85rem}}'
    ].join('');
    document.head.appendChild(style);
  }

  async function mount() {
    if (!isAccountPageVisible()) return;

    let host = document.getElementById('veloraBeautyJourney');
    const account = document.getElementById('accountContent');
    if (!account) return;

    if (!host) {
      host = document.createElement('div');
      host.id = 'veloraBeautyJourney';
      account.appendChild(host);
    }

    ensureStyles();
    renderSkeleton(host);

    try {
      const data = await loadJourney();
      if (!data) return;
      if (!data.profile) {
        renderEmpty(host);
        return;
      }
      render(host, data);
    } catch (error) {
      host.innerHTML =
        '<section class="velora-journey-card">' +
          '<div class="velora-journey-kicker">VELORA BEAUTY JOURNEY</div>' +
          '<h2>My Beauty Journey</h2>' +
          '<p class="velora-journey-muted">We could not load the latest journey state.</p>' +
        '</section>';
      console.error('Velora Beauty Journey error:', error);
    }
  }

  function scheduleMount() {
    setTimeout(() => { mount().catch(() => {}); }, 0);
    setTimeout(() => { mount().catch(() => {}); }, 350);
  }

  const originalNavigateTo = window.navigateTo;
  if (typeof originalNavigateTo === 'function') {
    window.navigateTo = function (page) {
      const result = originalNavigateTo.apply(this, arguments);
      if (page === 'account') scheduleMount();
      return result;
    };
  }

  window.addEventListener('velora:passport-v2-updated', scheduleMount);
  window.addEventListener('velora:feedback-updated', scheduleMount);
  window.addEventListener('hashchange', scheduleMount);
  window.addEventListener('popstate', scheduleMount);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleMount, { once: true });
  } else {
    scheduleMount();
  }

  console.log('✅ Velora Beauty Journey surface loaded');
})();