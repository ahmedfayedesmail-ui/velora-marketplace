/* ============================================================
   VELORA STAGE 15 — OPERATIONAL READINESS + INCIDENT CONTROL
   ============================================================ */
(function(){
'use strict';
const db=window.mahaSupabase;if(!db)return;
const esc=v=>typeof escapeHtml==='function'?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data??null;}
function badge(t){return `<span class="velora-ops-badge">${esc(t)}</span>`}
async function loadOps(){
 const c=document.getElementById('adminContent');if(!c)return;
 c.innerHTML='<div class="velora-pay-note">⏳ Loading operational control plane…</div>';
 try{
  const [summary,items]=await Promise.all([rpc('velora_get_ops_control_plane',{}),rpc('velora_get_recent_incidents',{p_limit:30})]);
  const open=Number(summary?.open_incidents||0), crit=Number(summary?.critical_open||0), high=Number(summary?.high_open||0), last=summary?.latest_incident_at?new Date(summary.latest_incident_at).toLocaleString():'—';
  const rows=Array.isArray(items)?items:[];
  c.innerHTML=`<div class="velora-sec-toolbar"><div><b>Stage 15 — Operational Readiness & Incident Control</b><div class="velora-op-muted">A controlled place for staff to record, investigate and resolve production incidents without exposing internal controls to customers.</div></div><button class="btn btn-primary" onclick="window.VELORA_RENDER_OPS_CONTROL_PLANE()">↻ Refresh</button></div>
  <div class="velora-ops-grid">
   <div class="velora-ops-card"><div>Open Incidents</div><div class="big">${open}</div><div class="velora-op-muted">Any status except resolved</div></div>
   <div class="velora-ops-card"><div>Critical</div><div class="big">${crit}</div><div class="velora-op-muted">Immediate operator attention</div></div>
   <div class="velora-ops-card"><div>High</div><div class="big">${high}</div><div class="velora-op-muted">Priority investigation</div></div>
   <div class="velora-ops-card"><div>Latest Incident</div><div class="big" style="font-size:1rem">${esc(last)}</div><div class="velora-op-muted">Canonical incident log</div></div>
  </div>
  <div class="velora-analytics-two">
   <div class="velora-analytics-card"><h3>🚨 Create Incident</h3>
    <div class="velora-ops-actions"><input id="veloraIncidentTitle" placeholder="Incident title" maxlength="180" style="flex:1;min-width:220px"><select id="veloraIncidentSeverity"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option><option value="critical">Critical</option></select><select id="veloraIncidentSource"><option value="manual" selected>Manual</option><option value="system">System</option><option value="provider">Provider</option><option value="customer">Customer</option><option value="seller">Seller</option></select><button class="btn btn-primary" onclick="window.VELORA_CREATE_INCIDENT()">Create</button></div>
    <textarea id="veloraIncidentDescription" placeholder="What happened? Impact, evidence, current mitigation…" maxlength="5000" style="width:100%;min-height:100px;margin-top:.7rem;border:1px solid var(--border);border-radius:10px;padding:.7rem;background:var(--bg);color:var(--text)"></textarea>
   </div>
   <div class="velora-analytics-card"><h3>🧭 Recovery Runbook</h3><div class="velora-launch-list">${(summary?.recovery_runbook||[]).map((x,i)=>`<div class="velora-launch-item"><div><b>${i+1}.</b> ${esc(x)}</div></div>`).join('')}</div></div>
  </div>
  <div class="velora-analytics-card" style="margin-top:1rem"><h3>📋 Recent Incidents</h3>${rows.length?rows.map(x=>`<div class="velora-ops-incident"><div><div><b>${esc(x.title)}</b> ${badge(String(x.severity||'').toUpperCase())} ${badge(String(x.status||'').toUpperCase())}</div><div class="velora-op-muted" style="margin-top:.3rem">${esc(x.description||'No description')} · ${esc(x.source||'manual')} · ${esc(x.created_at?new Date(x.created_at).toLocaleString():'—')}</div></div><div>${x.status!=='resolved'?`<button class="btn btn-secondary" onclick="window.VELORA_RESOLVE_INCIDENT('${esc(x.id)}')">Resolve</button>`:badge('Closed')}</div></div>`).join(''):'<div class="velora-op-muted" style="padding:1rem 0">No incidents recorded.</div>'}</div>
  <div class="velora-launch-gate"><b>Operational rule:</b> incident records are staff-only, and resolution is an explicit action. This layer does not claim automated monitoring or provider health unless a real integration reports it.</div>`;
 }catch(e){c.innerHTML=`<div class="velora-pay-note">❌ Operational control plane unavailable: ${esc(e.message||e)}</div>`}
}
window.VELORA_CREATE_INCIDENT=async function(){
 const title=(document.getElementById('veloraIncidentTitle')?.value||'').trim();
 const description=(document.getElementById('veloraIncidentDescription')?.value||'').trim()||null;
 const severity=document.getElementById('veloraIncidentSeverity')?.value||'medium';
 const source=document.getElementById('veloraIncidentSource')?.value||'manual';
 if(title.length<3){alert('Enter an incident title.');return;}
 try{await rpc('velora_create_incident',{p_title:title,p_description:description,p_severity:severity,p_source:source});await loadOps();}catch(e){alert(e.message||String(e));}
};
window.VELORA_RESOLVE_INCIDENT=async function(id){
 try{await rpc('velora_resolve_incident',{p_id:id});await loadOps();}catch(e){alert(e.message||String(e));}
};
window.VELORA_RENDER_OPS_CONTROL_PLANE=loadOps;
function addOpsNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-ops-nav]'))return;const section=document.createElement('div');section.className='admin-nav-section';section.innerHTML='<div class="admin-nav-title">Operations</div><div class="admin-nav-item" data-velora-ops-nav="1"><span>🚨</span><span>Incident Control</span></div>';section.querySelector('[data-velora-ops-nav]').onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('ops',section.querySelector('[data-velora-ops-nav]'));nav.appendChild(section)}
const prev=window.VELORA_CANONICAL_ADMIN_SECTION;window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='ops'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Incident Control';return loadOps()}return prev?prev(section,btn):undefined};
const oldOpen=window.VELORA_OPEN_ADMIN;window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(addOpsNav,220);return r};
setTimeout(addOpsNav,1300);
console.log('✅ Velora Stage 15 Operational Readiness + Incident Control loaded');
})();
