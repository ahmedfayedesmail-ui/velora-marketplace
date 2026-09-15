(function(){'use strict';
 if(window.__VELORA_STAGE22_LOADED)return;window.__VELORA_STAGE22_LOADED=true;
 const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 const statusLabel=s=>({pass:'PASS',warn:'WARN',fail:'FAIL',blocked:'BLOCKED',pending:'PENDING'}[s]||String(s||'—').toUpperCase());
 const statusCls=s=>s==='pass'?'velora-launch2-ready':(s==='warn'?'velora-launch2-warn':(s==='blocked'||s==='fail'?'velora-launch2-blocked':'velora-launch2-pending'));
 async function rpc(fn,args={}){if(typeof window.veloraRPC==='function')return window.veloraRPC(fn,args);if(typeof window.callRpc==='function')return window.callRpc(fn,args);throw new Error('Supabase RPC bridge unavailable')}
 async function render(){
  const c=document.getElementById('adminContent'); if(!c)return;
  c.innerHTML='<div class="velora-pay-note">⏳ Evaluating Production Launch Gates…</div>';
  try{
   const d=await rpc('velora_get_launch_control_plane',{}); const gates=Array.isArray(d?.gates)?d.gates:[];
   c.innerHTML=`<div class="velora-launch2-toolbar"><div><b>Stage 22 — Production Launch Console</b><div class="velora-launch2-muted">Single control plane for go-live readiness. “Ready” here means the internal platform gates are satisfied; external providers, infrastructure and deployment evidence still require environment validation.</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="window.VELORA_RUN_LAUNCH_GATE_AUDIT()">🚀 Run launch audit</button><button class="btn" onclick="window.VELORA_RENDER_LAUNCH_CONTROL()">↻ Refresh</button></div></div>
   <div class="velora-launch2-grid">
    <div class="velora-launch2-card"><div>Overall</div><div class="velora-launch2-kpi ${statusCls(d?.status==='ready_for_environment_validation'?'pass':d?.status)}">${esc(statusLabel(d?.status))}</div><div class="velora-launch2-muted">deployment decision</div></div>
    <div class="velora-launch2-card"><div>Passed</div><div class="velora-launch2-kpi velora-launch2-ready">${esc(d?.pass??0)}</div><div class="velora-launch2-muted">internal gates</div></div>
    <div class="velora-launch2-card"><div>Warnings</div><div class="velora-launch2-kpi velora-launch2-warn">${esc(d?.warn??0)}</div><div class="velora-launch2-muted">review before launch</div></div>
    <div class="velora-launch2-card"><div>Blocked</div><div class="velora-launch2-kpi velora-launch2-blocked">${esc(d?.blocked??0)}</div><div class="velora-launch2-muted">external dependency gates</div></div>
    <div class="velora-launch2-card"><div>Pending</div><div class="velora-launch2-kpi velora-launch2-pending">${esc(d?.pending??0)}</div><div class="velora-launch2-muted">environment evidence</div></div>
   </div>
   <div class="velora-launch2-card"><h3>🚦 Launch Gates</h3><div class="velora-launch2-muted" style="margin-bottom:8px">Required gates block the final decision when they are failed, blocked, or still pending.</div>
    <div class="velora-launch2-row" style="font-weight:800"><div>Gate</div><div>Domain</div><div>Status</div><div>Evidence / notes</div></div>
    ${gates.map(g=>`<div class="velora-launch2-row"><div><b>${esc(g.gate_name)}</b><div class="velora-launch2-muted">${esc(g.gate_code)} ${g.required?'• required':'• optional'}</div></div><div><span class="velora-launch2-pill">${esc(g.domain)}</span></div><div class="${statusCls(g.status)}">${esc(statusLabel(g.status))}</div><div class="velora-launch2-muted">${esc(g.notes||'No note recorded.')}${g.checked_at?`<br>Checked: ${esc(g.checked_at)}`:''}</div></div>`).join('')}
   </div>
   <div class="velora-launch2-gate"><b>🔒 Final Go-Live Rule</b><div class="velora-launch2-muted" style="margin-top:6px">Velora must not be declared fully live while required external dependencies remain blocked or pending. In particular, live payment credentials, provider-specific webhook signature verification, production infrastructure validation, backups/rollback evidence, and carrier integrations must be verified in the deployment environment.</div></div>`;
  }catch(e){c.innerHTML=`<div class="velora-pay-note">❌ Launch console unavailable: ${esc(e.message||e)}</div>`}
 }
 window.VELORA_RUN_LAUNCH_GATE_AUDIT=async function(){try{await rpc('velora_run_launch_gate_audit',{});await render()}catch(e){alert(e.message||String(e))}};
 window.VELORA_RENDER_LAUNCH_CONTROL=render;
 function addNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-launch2-nav]'))return;const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Release</div><div class="admin-nav-item" data-velora-launch2-nav="1"><span>🚀</span><span>Production Launch</span></div>';const item=sec.querySelector('[data-velora-launch2-nav]');item.onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('productionLaunch',item);nav.appendChild(sec)}
 const prev=window.VELORA_CANONICAL_ADMIN_SECTION;window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='productionLaunch'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Production Launch';return render()}return prev?prev(section,btn):undefined};
 const oldOpen=window.VELORA_OPEN_ADMIN;window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(addNav,350);return r};setTimeout(addNav,1800);
 console.log('✅ Velora Stage 22 Production Launch Console loaded');
})();
