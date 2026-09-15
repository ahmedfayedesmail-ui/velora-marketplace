/* ============================================================
   VELORA STAGE 17 — AUTOMATED RECONCILIATION & DATA INTEGRITY
   ============================================================ */
(function(){
'use strict';
const db=window.mahaSupabase;if(!db)return;
const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data??null;}
function sevClass(s){return ['critical','high','medium','low'].includes(String(s||''))?String(s):'medium'}
async function renderReconciliation(){
 const c=document.getElementById('adminContent');if(!c)return;
 c.innerHTML='<div class="velora-pay-note">⏳ Loading reconciliation control plane…</div>';
 try{
  const d=await rpc('velora_get_reconciliation_dashboard',{}), run=d?.latest_run||null, findings=Array.isArray(d?.recent_findings)?d.recent_findings:[];
  const total=Number(run?.total_findings||0), critical=Number(run?.critical_count||0), high=Number(run?.high_count||0), open=Number(d?.open_findings||0);
  const result=run?.summary?.result || (total===0?'clean':'review_findings');
  c.innerHTML=`<div class="velora-sec-toolbar"><div><b>Stage 17 — Automated Reconciliation & Data Integrity</b><div class="velora-op-muted">Detects cross-system inconsistencies without mutating commerce records automatically.</div></div><div class="velora-rec-actions"><button class="btn btn-primary" onclick="window.VELORA_RUN_RECONCILIATION()">▶ Run integrity scan</button><button class="btn" onclick="window.VELORA_RENDER_RECONCILIATION()">↻ Refresh</button></div></div>
  <div class="velora-rec-grid">
   <div class="velora-rec-card"><div>Last Scan</div><div class="big">${run?esc(new Date(run.started_at).toLocaleString()):'—'}</div><div class="velora-op-muted">${run?esc(String(run.status||'unknown').toUpperCase()):'No scan yet'}</div></div>
   <div class="velora-rec-card"><div>Integrity Result</div><div class="big">${esc(String(result).replaceAll('_',' ').toUpperCase())}</div><div class="velora-op-muted">Safe detection-only control</div></div>
   <div class="velora-rec-card"><div>Critical / High</div><div class="big">${critical} / ${high}</div><div class="velora-op-muted">Immediate investigation priority</div></div>
   <div class="velora-rec-card"><div>Open Findings</div><div class="big">${open}</div><div class="velora-op-muted">Historical unresolved findings</div></div>
  </div>
  <div class="velora-analytics-two">
   <div class="velora-analytics-card"><h3>🧪 What Gets Reconciled</h3><div class="velora-launch-list"><div class="velora-launch-item"><b>Order totals</b><small>Line items vs discount + shipping vs canonical order total.</small></div><div class="velora-launch-item"><b>Payments</b><small>Paid order state vs captured/paid payment-attempt totals and orphan attempts.</small></div><div class="velora-launch-item"><b>Fulfillment</b><small>Orphan shipments plus shipped/delivered timestamp consistency.</small></div><div class="velora-launch-item"><b>Seller economics</b><small>Seller earning vs line subtotal less commission.</small></div><div class="velora-launch-item"><b>Referential integrity</b><small>Detects order items and shipments pointing at missing parent records.</small></div></div></div>
   <div class="velora-analytics-card"><h3>🛡️ Safety Model</h3><div class="velora-launch-gate">The scan is <b>detection-only</b>. It does not auto-edit orders, payments, shipments or seller balances. Findings become evidence for Operations / Trust & Safety workflows.</div><div class="velora-op-muted" style="margin-top:.7rem">Run IDs and findings are persisted for auditability and future automated alerting.</div></div>
  </div>
  <div class="velora-analytics-card" style="margin-top:1rem"><h3>🔎 Recent Findings</h3>${findings.length?findings.map(f=>`<div class="velora-rec-find"><span class="velora-rec-sev ${sevClass(f.severity)}">${esc(f.severity)}</span><div><b>${esc(f.message)}</b><div class="velora-rec-code">${esc(f.check_code)} · ${esc(f.entity_type)} · ${esc(f.entity_id||'—')}</div></div><div class="velora-op-muted">${esc(new Date(f.created_at).toLocaleString())}</div></div>`).join(''):'<div class="velora-health">✅ No recent findings.</div>'}</div>`;
 }catch(e){c.innerHTML=`<div class="velora-pay-note">❌ Reconciliation control plane unavailable: ${esc(e.message||e)}</div>`}
}
window.VELORA_RUN_RECONCILIATION=async function(){try{await rpc('velora_run_integrity_scan',{});await renderReconciliation();}catch(e){alert(e.message||String(e));}};
window.VELORA_RENDER_RECONCILIATION=renderReconciliation;
function addReconciliationNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-rec-nav]'))return;const section=document.createElement('div');section.className='admin-nav-section';section.innerHTML='<div class="admin-nav-title">Reliability</div><div class="admin-nav-item" data-velora-rec-nav="1"><span>🧪</span><span>Data Integrity</span></div>';section.querySelector('[data-velora-rec-nav]').onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('reconciliation',section.querySelector('[data-velora-rec-nav]'));nav.appendChild(section)}
const prev=window.VELORA_CANONICAL_ADMIN_SECTION;window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='reconciliation'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Data Integrity';return renderReconciliation()}return prev?prev(section,btn):undefined};
const oldOpen=window.VELORA_OPEN_ADMIN;window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(addReconciliationNav,320);return r};
setTimeout(addReconciliationNav,1600);
console.log('✅ Velora Stage 17 Reconciliation & Data Integrity loaded');
})();
