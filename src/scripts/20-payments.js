/* ============================================================
   VELORA STAGE 16 — REAL INTEGRATION CONTROL PLANE
   ============================================================ */
(function(){
'use strict';
const db=window.mahaSupabase;if(!db)return;
const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data??null;}
function chip(t){return `<span class="velora-int-chip">${esc(t)}</span>`}
async function loadIntegrations(){
 const c=document.getElementById('adminContent');if(!c)return;
 c.innerHTML='<div class="velora-pay-note">⏳ Loading integration control plane…</div>';
 try{
  const data=await rpc('velora_get_integration_control_plane',{});
  const rows=Array.isArray(data?.integrations)?data.integrations:[];
  const ready=rows.filter(x=>x.status==='ready').length;
  const degraded=rows.filter(x=>x.status==='degraded').length;
  const blocked=rows.filter(x=>x.status==='blocked').length;
  c.innerHTML=`<div class="velora-sec-toolbar"><div><b>Stage 16 — Real Integration Control Plane</b><div class="velora-op-muted">Provider-neutral registry for payment, webhook, shipping and other external dependencies. Secrets are never stored here.</div></div><button class="btn btn-primary" onclick="window.VELORA_RENDER_INTEGRATIONS()">↻ Refresh</button></div>
  <div class="velora-int-grid">
   <div class="velora-int-card"><div>Registered Integrations</div><div class="big">${rows.length}</div><div class="velora-op-muted">Canonical registry</div></div>
   <div class="velora-int-card"><div>Ready</div><div class="big">${ready}</div><div class="velora-op-muted">Configured and operational</div></div>
   <div class="velora-int-card"><div>Degraded</div><div class="big">${degraded}</div><div class="velora-op-muted">Needs investigation</div></div>
   <div class="velora-int-card"><div>Blocked</div><div class="big">${blocked}</div><div class="velora-op-muted">Cannot be trusted</div></div>
  </div>
  <div class="velora-analytics-card"><h3>🔌 Integration Registry</h3>${rows.length?rows.map(x=>`<div class="velora-int-row"><div style="min-width:0"><div style="display:flex;gap:.45rem;flex-wrap:wrap;align-items:center"><b>${esc(x.name||x.integration_key)}</b>${chip(String(x.integration_type||'external').toUpperCase())}${chip(String(x.environment||'production').toUpperCase())}${chip(String(x.status||'unknown').toUpperCase())}</div><div class="velora-op-muted" style="margin-top:.35rem">${esc(x.description||'No description')} · Last health: ${esc(x.last_health_at?new Date(x.last_health_at).toLocaleString():'—')}</div><div style="margin-top:.45rem;display:flex;gap:.4rem;flex-wrap:wrap">${chip(x.credentials_configured?'Credentials configured':'Credentials missing')}${chip(x.webhook_signature_verified?'Webhook verified':'Webhook verification pending')}${x.last_error?chip('Error: '+String(x.last_error).slice(0,80)):chip('No recorded error')}</div></div><div class="velora-int-actions"><select onchange="window.VELORA_SET_INTEGRATION('${esc(x.id)}',this.value)"><option value="ready" ${x.status==='ready'?'selected':''}>Ready</option><option value="degraded" ${x.status==='degraded'?'selected':''}>Degraded</option><option value="blocked" ${x.status==='blocked'?'selected':''}>Blocked</option><option value="pending" ${x.status==='pending'?'selected':''}>Pending</option></select></div></div>`).join(''):'<div class="velora-op-muted">No integrations have been registered yet.</div>'}</div>
  <div class="velora-analytics-two" style="margin-top:1rem">
   <div class="velora-analytics-card"><h3>🧱 Integration Contract</h3><div class="velora-launch-list"><div class="velora-launch-item"><b>Payments:</b> server-side provider credentials + idempotent payment session creation + signed webhook verification.</div><div class="velora-launch-item"><b>Shipping:</b> carrier adapter or trusted manual tracking path + shipment status reconciliation.</div><div class="velora-launch-item"><b>Security:</b> no provider secret belongs in HTML, client-side storage, or public tables.</div><div class="velora-launch-item"><b>Recovery:</b> every external call needs timeout/error handling and a safe retry strategy.</div></div></div>
   <div class="velora-analytics-card"><h3>🚦 Go-Live Gate</h3><div class="velora-launch-gate">A provider can be marked <b>Ready</b> here only as an operational declaration. This registry does not magically validate credentials or perform live provider calls. Real health checks must come from the integration itself.</div><div class="velora-op-muted" style="margin-top:.7rem">Current policy: never treat an unverified webhook or missing credentials as trusted settlement infrastructure.</div></div>
  </div>`;
 }catch(e){c.innerHTML=`<div class="velora-pay-note">❌ Integration control plane unavailable: ${esc(e.message||e)}</div>`}
}
window.VELORA_SET_INTEGRATION=async function(id,status){try{await rpc('velora_set_integration_status',{p_id:id,p_status:status});await loadIntegrations();}catch(e){alert(e.message||String(e));}};
window.VELORA_RENDER_INTEGRATIONS=loadIntegrations;
function addIntegrationsNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-int-nav]'))return;const section=document.createElement('div');section.className='admin-nav-section';section.innerHTML='<div class="admin-nav-title">Integrations</div><div class="admin-nav-item" data-velora-int-nav="1"><span>🔌</span><span>Integration Control</span></div>';section.querySelector('[data-velora-int-nav]').onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('integrations',section.querySelector('[data-velora-int-nav]'));nav.appendChild(section)}
const prev=window.VELORA_CANONICAL_ADMIN_SECTION;window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='integrations'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Integration Control';return loadIntegrations()}return prev?prev(section,btn):undefined};
const oldOpen=window.VELORA_OPEN_ADMIN;window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(addIntegrationsNav,260);return r};
setTimeout(addIntegrationsNav,1450);
console.log('✅ Velora Stage 16 Real Integration Control Plane loaded');
})();
