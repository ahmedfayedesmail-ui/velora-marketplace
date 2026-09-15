/* ============================================================
   VELORA STAGE 13 — PRODUCTION HARDENING CONTROL PLANE
   ============================================================
*/
(function(){
'use strict';
const db=window.mahaSupabase;if(!db)return;
const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data||{};}
async function loadHardening(){
  const [diag,counts]=await Promise.all([
    rpc('velora_get_security_diagnostics',{}),
    rpc('velora_get_performance_summary',{})
  ]);
  return {diag,counts};
}
function row(label,ok,detail){return `<div class="velora-sec-item"><div><b>${esc(label)}</b><small>${esc(detail||'')}</small></div><span class="velora-sec-badge">${ok?'✅ Pass':'⚠️ Review'}</span></div>`}
async function renderHardening(){
 const c=document.getElementById('adminContent');if(!c)return;
 c.innerHTML='<div class="velora-pay-note">⏳ Running production hardening checks…</div>';
 try{
  const {diag,counts}=await loadHardening();
  const r=diag||{};
  c.innerHTML=`<div class="velora-sec-toolbar"><div><b>Stage 13 — Production Security & Performance</b><div class="velora-op-muted">Operational diagnostics against the canonical Supabase control plane.</div></div><button class="btn btn-primary" onclick="window.VELORA_RENDER_HARDENING()">↻ Re-run checks</button></div>
  <div class="velora-sec-grid">
   <div class="velora-sec-card"><div>RLS Coverage</div><div class="value">${Number(r.rls_tables||0).toLocaleString()}</div><small>Protected operational tables</small></div>
   <div class="velora-sec-card"><div>Security Functions</div><div class="value">${Number(r.security_functions||0).toLocaleString()}</div><small>Backend security helpers</small></div>
   <div class="velora-sec-card"><div>Operational Indexes</div><div class="value">${Number(counts.operational_indexes||0).toLocaleString()}</div><small>Indexes supporting workflows</small></div>
   <div class="velora-sec-card"><div>Audit Events</div><div class="value">${Number(counts.audit_events||0).toLocaleString()}</div><small>Total recorded audit events</small></div>
  </div>
  <div class="velora-analytics-two">
   <div class="velora-analytics-card"><h3>🛡️ Security Checks</h3><div class="velora-sec-list">
    ${row('Row Level Security',r.rls_tables>0,'Canonical operational tables expose RLS metadata.')}
    ${row('Role Boundary',r.role_helpers>0,'Role checks resolve through database functions.')}
    ${row('Audit Trail',r.audit_enabled===true,'Sensitive operational events are recorded.')}
    ${row('Webhook Integrity',r.webhook_writer===true,'Webhook persistence path exists; provider signature validation remains provider-specific.')}
   </div></div>
   <div class="velora-analytics-card"><h3>⚡ Performance Checks</h3><div class="velora-sec-list">
    ${row('Order Item Access',counts.order_item_index>0,'Seller/customer order-item lookup is indexed.')}
    ${row('Shipment Access',counts.shipment_index>0,'Shipment operational lookups are indexed.')}
    ${row('Trust & Safety Access',counts.trust_index>0,'Trust & Safety workflow lookups are indexed.')}
    ${row('Analytics Access',counts.analytics_index>0,'Analytics-related timestamp paths are indexed.')}
   </div></div>
  </div>
  <div class="velora-analytics-card" style="margin-top:1rem"><h3>🔐 Production Notes</h3><div class="velora-health"><b>Secrets:</b> provider credentials must stay in server-side project secrets.</div><div class="velora-health"><b>Payments:</b> Live provider settlement is not considered enabled until real provider credentials and verified webhook signatures are configured.</div><div class="velora-health"><b>Legacy:</b> legacy marketplace data remains compatibility-only and does not become a security authority.</div></div>`;
 }catch(e){c.innerHTML=`<div class="velora-pay-note">❌ Hardening diagnostics unavailable: ${esc(e.message||e)}</div>`}
}
function addHardeningNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-hardening-nav]'))return;const section=document.createElement('div');section.className='admin-nav-section';section.innerHTML='<div class="admin-nav-title">Platform</div><div class="admin-nav-item" data-velora-hardening-nav="1"><span>🔐</span><span>Security & Performance</span></div>';section.querySelector('[data-velora-hardening-nav]').onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('hardening',section.querySelector('[data-velora-hardening-nav]'));nav.appendChild(section)}
window.VELORA_RENDER_HARDENING=renderHardening;
const prev=window.VELORA_CANONICAL_ADMIN_SECTION;window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='hardening'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Security & Performance';return renderHardening()}return prev?prev(section,btn):undefined};
const oldOpen=window.VELORA_OPEN_ADMIN;window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(addHardeningNav,140);return r};
setTimeout(addHardeningNav,900);
})();
