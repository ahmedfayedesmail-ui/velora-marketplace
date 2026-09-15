(function(){
 'use strict';
 const sb=window.supabaseClient||window.supabase;
 async function callRpc(name,args){ if(!sb?.rpc) throw new Error('Supabase client unavailable'); const r=await sb.rpc(name,args||{}); if(r.error) throw r.error; return r.data; }
 function esc(v){return String(v??'').replace(/[&<>"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]))}
 function badge(text,kind){return `<span class="velora-wf-badge" style="background:${kind==='critical'?'rgba(239,68,68,.14)':kind==='high'?'rgba(245,158,11,.14)':'rgba(59,130,246,.14)'}">${esc(text)}</span>`}
 async function render(){
   const c=document.getElementById('adminContent')||document.querySelector('#adminPlatform .admin-content');
   if(!c)return;
   c.innerHTML='<div class="velora-pay-note">⏳ Loading Unified Workflow Orchestration…</div>';
   try{
    const d=await callRpc('velora_get_workflow_control_plane');
    const cases=Array.isArray(d?.cases)?d.cases:[];
    c.innerHTML=`<div class="velora-wf-toolbar"><div><b>Stage 19 — Unified Workflow Orchestration</b><div class="velora-wf-muted">One operational case model connecting incidents, integrity findings, payment failures and shipping exceptions with ownership, SLA and escalation.</div></div><div class="velora-wf-actions"><button class="btn btn-primary" onclick="window.VELORA_NEW_WORKFLOW_CASE()">＋ New case</button><button class="btn" onclick="window.VELORA_RENDER_WORKFLOW()">↻ Refresh</button></div></div>
    <div class="velora-wf-grid"><div class="velora-wf-card"><div class="velora-wf-muted">Open cases</div><div class="velora-wf-kpi">${d?.open_cases??0}</div></div><div class="velora-wf-card"><div class="velora-wf-muted">Overdue SLA</div><div class="velora-wf-kpi">${d?.overdue_cases??0}</div></div><div class="velora-wf-card"><div class="velora-wf-muted">Critical</div><div class="velora-wf-kpi">${d?.critical_cases??0}</div></div><div class="velora-wf-card"><div class="velora-wf-muted">Open escalations</div><div class="velora-wf-kpi">${d?.escalations_open??0}</div></div></div>
    <div class="velora-wf-card"><table class="velora-wf-table"><thead><tr><th>Case</th><th>Source</th><th>Priority</th><th>Status</th><th>Owner</th><th>SLA</th><th>Action</th></tr></thead><tbody>${cases.length?cases.map(x=>`<tr><td><b>${esc(x.case_key)}</b><div>${esc(x.title)}</div><div class="velora-wf-muted">${esc(x.description||'')}</div></td><td>${esc(x.source_type)}</td><td>${badge(x.priority,x.priority)}</td><td>${esc(x.status)}</td><td>${esc(x.owner_role)}</td><td class="${x.sla_due_at&&new Date(x.sla_due_at)<new Date()&&x.status!=='resolved'?'velora-wf-overdue':''}">${x.sla_due_at?esc(new Date(x.sla_due_at).toLocaleString()):'—'}</td><td><div class="velora-wf-actions"><button class="btn btn-sm" onclick="window.VELORA_ESCALATE_WORKFLOW('${esc(x.id)}')">Escalate</button><button class="btn btn-sm" onclick="window.VELORA_RESOLVE_WORKFLOW('${esc(x.id)}')">Resolve</button></div></td></tr>`).join(''):'<tr><td colspan="7" class="velora-wf-muted">No workflow cases yet.</td></tr>'}</tbody></table></div>`;
   }catch(e){c.innerHTML=`<div class="velora-pay-note">⚠️ Workflow Control Plane unavailable: ${esc(e.message||e)}</div>`}
 }
 window.VELORA_RENDER_WORKFLOW=render;
 window.VELORA_NEW_WORKFLOW_CASE=async function(){
   const title=prompt('Case title:'); if(!title)return;
   const source=prompt('Source type (incident/integrity/payment/shipping/manual):','manual')||'manual';
   const priority=prompt('Priority (low/medium/high/critical):','medium')||'medium';
   const owner=prompt('Owner role (operations/finance/trust_safety/logistics/platform):','operations')||'operations';
   const hours=Number(prompt('SLA hours:','24')||24);
   try{await callRpc('velora_create_workflow_case',{p_source_type:source,p_source_id:null,p_title:title,p_description:'Created from Velora Workflow Control Plane',p_priority:priority,p_owner_role:owner,p_sla_hours:hours});render()}catch(e){alert(e.message||e)}
 };
 window.VELORA_RESOLVE_WORKFLOW=async function(id){try{await callRpc('velora_update_workflow_case',{p_case_id:id,p_status:'resolved',p_note:'Resolved from control plane'});render()}catch(e){alert(e.message||e)}};
 window.VELORA_ESCALATE_WORKFLOW=async function(id){const role=prompt('Escalate to role:','trust_safety');if(!role)return;const reason=prompt('Reason:','SLA risk / requires specialist review');if(!reason)return;try{await callRpc('velora_escalate_workflow_case',{p_case_id:id,p_to_role:role,p_reason:reason,p_due_hours:4});render()}catch(e){alert(e.message||e)}};
 function addNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-wf-nav]'))return;const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Operations</div><div class="admin-nav-item" data-velora-wf-nav="1"><span>🧭</span><span>Workflow Orchestration</span></div>';const item=sec.querySelector('[data-velora-wf-nav]');item.onclick=()=>window.VELORA_CANONICAL_ADMIN_SECTION('workflow',item);nav.appendChild(sec)}
 const prev=window.VELORA_CANONICAL_ADMIN_SECTION;
 window.VELORA_CANONICAL_ADMIN_SECTION=async function(section,btn){if(section==='workflow'){document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));if(btn)btn.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='Workflow Orchestration';return render()}return prev?prev(section,btn):undefined};
 addNav();
 console.log('✅ Velora Stage 19 Unified Workflow Orchestration loaded');
})();
