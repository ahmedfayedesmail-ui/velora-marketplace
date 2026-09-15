(function(){'use strict';
 const db=window.supabaseClient||window.db;if(!db)return;
 const esc=v=>window.escapeHtml?escapeHtml(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 async function rpc(name,args){const {data,error}=await db.rpc(name,args||{});if(error)throw error;return data??null}
 function severityClass(s){return ['critical','high','medium','low'].includes(String(s||''))?String(s):'medium'}
 async function renderAutomation(){
  const c=document.getElementById('adminContent');if(!c)return;
  c.innerHTML='<div class="velora-pay-note">⏳ Loading Event Automation & Alerting…</div>';
  try{
   const [cp,alerts,events]=await Promise.all([rpc('velora_get_automation_control_plane',{}),rpc('velora_get_recent_automation_alerts',{p_limit:30}),rpc('velora_get_recent_automation_events',{p_limit:30})]);
   const a=Array.isArray(alerts)?alerts:[], e=Array.isArray(events)?events:[];
   const open=Number(cp?.open_alerts||0),critical=Number(cp?.critical_alerts||0),high=Number(cp?.high_alerts||0),unprocessed=Number(cp?.unprocessed_events||0);
   c.innerHTML=`<div class="velora-auto-toolbar"><div><b>Stage 18 — Event-Driven Automation & Alerting</b><div class="velora-op-muted">Turns critical operational signals into auditable events and alerts without silently mutating commerce data.</div></div><div class="velora-auto-actions"><button class="btn btn-primary" onclick="window.VELORA_RUN_AUTOMATION_CYCLE()">⚡ Process queue</button><button class="btn" onclick="window.VELORA_RENDER_AUTOMATION()">↻ Refresh</button></div></div>
   <div class="velora-auto-grid">
    <div class="velora-auto-card"><div>Open Alerts</div><div class="value">${open.toLocaleString()}</div><small>Active operational attention</small></div>
    <div class="velora-auto-card"><div>Critical</div><div class="value">${critical.toLocaleString()}</div><small>Immediate escalation candidates</small></div>
    <div class="velora-auto-card"><div>High</div><div class="value">${high.toLocaleString()}</div><small>Priority investigation</small></div>
    <div class="velora-auto-card"><div>Queue</div><div class="value">${unprocessed.toLocaleString()}</div><small>Unprocessed automation events</small></div>
   </div>
   <div class="velora-analytics-card"><h3>🚨 Alert Center</h3>${a.length?'<div class="velora-auto-list">'+a.map(x=>`<div class="velora-auto-row"><span class="velora-auto-sev ${severityClass(x.severity)}">${esc(x.severity)}</span><span class="velora-auto-status">${esc(x.status)}</span><div><b>${esc(x.title)}</b><div class="velora-op-muted">${esc(x.message)}${x.entity_type?' · '+esc(x.entity_type):''}</div></div>${x.status==='open'?`<div class="velora-auto-actions"><button class="btn" onclick="window.VELORA_ALERT_ACK('${esc(x.id)}')">Acknowledge</button><button class="btn btn-primary" onclick="window.VELORA_ALERT_RESOLVE('${esc(x.id)}')">Resolve</button></div>`:'<span class="velora-op-muted">'+esc(new Date(x.created_at).toLocaleString())+'</span>'}</div>`).join('')+'</div>':'<div class="velora-auto-empty">✅ No active automation alerts.</div>'}</div>
   <div class="velora-analytics-card" style="margin-top:1rem"><h3>🛰️ Event Stream</h3>${e.length?'<div class="velora-auto-list">'+e.map(x=>`<div class="velora-auto-row"><span class="velora-auto-sev ${severityClass(x.severity)}">${esc(x.severity)}</span><span class="velora-auto-status">${x.processed_at?'processed':'queued'}</span><div><b>${esc(x.event_type)}</b><div class="velora-op-muted">${esc(x.source_type)} · ${esc(x.source_id||'—')}</div></div><span class="velora-op-muted">${esc(new Date(x.created_at).toLocaleString())}</span></div>`).join('')+'</div>':'<div class="velora-auto-empty">No events recorded yet.</div>'}</div>
   <div class="velora-analytics-card" style="margin-top:1rem"><h3>🧠 Automation Guardrails</h3><div class="velora-op-muted">Alerts are derived from database events and preserved as evidence. The automation layer does not approve refunds, move funds, change seller balances, or alter order state on its own.</div></div>`;
  }catch(err){c.innerHTML=`<div class="velora-pay-note">❌ Automation control plane unavailable: ${esc(err.message||err)}</div>`}
 }
 window.VELORA_RUN_AUTOMATION_CYCLE=async function(){try{const n=await rpc('velora_process_automation_queue',{p_limit:100});alert('Automation queue processed: '+Number(n||0)+' event(s).');await renderAutomation()}catch(e){alert(e.message||String(e))}};
 window.VELORA_ALERT_ACK=async function(id){try{await rpc('velora_update_automation_alert',{p_alert_id:id,p_status:'acknowledged'});await renderAutomation()}catch(e){alert(e.message||String(e))}};
 window.VELORA_ALERT_RESOLVE=async function(id){try{await rpc('velora_update_automation_alert',{p_alert_id:id,p_status:'resolved'});await renderAutomation()}catch(e){alert(e.message||String(e))}};
 window.VELORA_RENDER_AUTOMATION=renderAutomation;
 function addAutomationNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-auto-nav]'))return;const section=document.createElement('div');section.className='admin-nav-section';section.innerHTML='<div class="admin-nav-title">Automation</div><div class="admin-nav-item" data-velora-auto-nav="1"><span>⚡</span><span>Event Automation</span></div>';const item=section.querySelector('[data-velora-auto-nav]');item.onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('automation',item);nav.appendChild(section)}
 const prev=window.VELORA_CANONICAL_ADMIN_SECTION;window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='automation'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Event Automation';return renderAutomation()}return prev?prev(section,btn):undefined};
 const oldOpen=window.VELORA_OPEN_ADMIN;window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(addAutomationNav,360);return r};
 setTimeout(addAutomationNav,1800);
 console.log('✅ Velora Stage 18 Event Automation & Alerting loaded');
})();
