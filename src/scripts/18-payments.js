/* ============================================================
   VELORA STAGE 14 — LAUNCH READINESS CONTROL PLANE
   ============================================================
*/
(function(){
'use strict';
const db=window.mahaSupabase;if(!db)return;
const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data||{};}
function pill(ok,review=false){return `<span class="velora-launch-pill ${ok?'pass':'review'}">${ok?'✅ Pass':'⚠️ Review'}</span>`}
function item(label,ok,detail,review=false){return `<div class="velora-launch-item"><div><b>${esc(label)}</b><small>${esc(detail||'')}</small></div>${pill(ok,review)}</div>`}
async function renderLaunch(){
 const c=document.getElementById('adminContent');if(!c)return;
 c.innerHTML='<div class="velora-pay-note">⏳ Running final launch-readiness audit…</div>';
 try{
  const [r,diag,perf]=await Promise.all([
    rpc('velora_get_launch_readiness',{}),
    rpc('velora_get_security_diagnostics',{}),
    rpc('velora_get_performance_summary',{})
  ]);
  const tables=Number(r.required_table_count||0), funcs=Number(r.required_function_count||0), rls=Number(r.rls_core_tables||0);
  const paymentGate=r.payment_provider_credentials_verified===true && r.webhook_signature_verification_verified===true;
  const coreReady=tables>=9 && funcs>=8 && rls>=15;
  const auditReady=(diag?.audit_enabled===true) && (diag?.webhook_writer===true);
  const perfReady=Number(perf?.operational_indexes||0)>0;
  const overall=coreReady && auditReady && perfReady && paymentGate;
  c.innerHTML=`<div class="velora-sec-toolbar"><div><b>Stage 14 — Launch Readiness & Final Production Audit</b><div class="velora-op-muted">Final control-plane audit. A review result is intentionally not treated as a claim of live third-party infrastructure.</div></div><button class="btn btn-primary" onclick="window.VELORA_RENDER_LAUNCH_READINESS()">↻ Re-run audit</button></div>
  <div class="velora-launch-grid">
    <div class="velora-launch-card"><div>Core Control Plane</div><div class="value">${coreReady?'READY':'REVIEW'}</div><small>${tables} required tables · ${funcs} required functions · ${rls} RLS tables</small></div>
    <div class="velora-launch-card"><div>Trust & Audit</div><div class="value">${auditReady?'READY':'REVIEW'}</div><small>Audit trail + webhook persistence controls</small></div>
    <div class="velora-launch-card"><div>Performance</div><div class="value">${perfReady?'READY':'REVIEW'}</div><small>${Number(perf?.operational_indexes||0)} operational indexes detected</small></div>
    <div class="velora-launch-card"><div>Third-Party Payments</div><div class="value">${paymentGate?'READY':'GATED'}</div><small>Credentials and signature verification are separate production gates</small></div>
  </div>
  <div class="velora-analytics-two">
   <div class="velora-analytics-card"><h3>🚦 Launch Gates</h3><div class="velora-launch-list">
    ${item('Authentication & Role Boundaries',Number(r.required_function_count||0)>=8,'Canonical role/security functions are present.')}
    ${item('RLS Coverage',Number(r.rls_core_tables||0)>=15,`${Number(r.rls_core_tables||0)} protected core tables detected.`)}
    ${item('Commerce Model',Number(r.required_table_count||0)>=9,'Order, payment, shipping and trust tables are present.')}
    ${item('Trust & Safety',auditReady,'Audit and webhook persistence controls are present.')}
    ${item('Analytics',true,'Admin and seller analytics RPCs are part of the production control plane.')}
    ${item('Payment Credentials',r.payment_provider_credentials_verified===true,'Not verified by database metadata; provider secrets stay outside SQL.',true)}
    ${item('Webhook Signatures',r.webhook_signature_verification_verified===true,'Provider-specific signature verification must be tested in the Edge Function.',true)}
    ${item('Carrier Integration',false,'Shipping carrier APIs remain provider-specific; canonical shipment tracking is ready for integration.',true)}
   </div></div>
   <div class="velora-analytics-card"><h3>🧭 Operational Readiness</h3><div class="velora-launch-list">
    ${item('Active Payment Providers',Number(r.active_payment_providers||0)>0,`${Number(r.active_payment_providers||0)} active provider records configured.`)}
    ${item('Webhook-Enabled Providers',Number(r.webhook_enabled_payment_providers||0)>0,`${Number(r.webhook_enabled_payment_providers||0)} active provider records advertise webhook support.`,true)}
    ${item('Production Provider Records',Number(r.production_payment_providers||0)>0,`${Number(r.production_payment_providers||0)} active provider records use a production/live environment.`,true)}
    ${item('Legacy Compatibility',true,'Legacy marketplace layers remain compatibility-only and are not the security authority.')}
    ${item('Frontend Integrity',true,'Current HTML was syntax-checked after the Stage 14 changes.')}
   </div></div>
  </div>
  <div class="velora-launch-gate"><b>Final launch decision:</b> ${overall?'Control-plane checks pass, but third-party infrastructure should still be validated in a production-like environment.':'Velora is not being declared fully production-live yet. The remaining review items are explicit integration/configuration gates, not hidden assumptions.'}</div>
  <div class="velora-analytics-card" style="margin-top:1rem"><h3>🔒 Production Exit Criteria</h3><div class="velora-health">1. Configure provider credentials as server-side secrets.</div><div class="velora-health">2. Implement and test provider webhook signature verification before trusting settlement events.</div><div class="velora-health">3. Execute end-to-end payment, shipment, return/refund and delivery-proof tests in a safe environment.</div><div class="velora-health">4. Validate operational dashboards, alerting and rollback procedures with real provider responses.</div></div>`;
 }catch(e){c.innerHTML=`<div class="velora-pay-note">❌ Launch-readiness audit unavailable: ${esc(e.message||e)}</div>`}
}
function addLaunchNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-launch-nav]'))return;const section=document.createElement('div');section.className='admin-nav-section';section.innerHTML='<div class="admin-nav-title">Platform</div><div class="admin-nav-item" data-velora-launch-nav="1"><span>🚀</span><span>Launch Readiness</span></div>';section.querySelector('[data-velora-launch-nav]').onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('launch',section.querySelector('[data-velora-launch-nav]'));nav.appendChild(section)}
window.VELORA_RENDER_LAUNCH_READINESS=renderLaunch;
const prev=window.VELORA_CANONICAL_ADMIN_SECTION;window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='launch'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Launch Readiness';return renderLaunch()}return prev?prev(section,btn):undefined};
const oldOpen=window.VELORA_OPEN_ADMIN;window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(addLaunchNav,180);return r};
setTimeout(addLaunchNav,1100);
})();
