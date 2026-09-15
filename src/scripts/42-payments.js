(()=>{
'use strict';
const esc47=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const rpc47=async(name,args={})=>{const c=window.supabaseClient||window.sb;if(!c?.rpc)throw new Error('Supabase client unavailable');return await c.rpc(name,args)};
const host47=()=>document.getElementById('veloraSupport47');
function pill47(v,cls=''){return '<span class="velora-sup47-pill '+cls+'">'+esc47(v||'—')+'</span>'}
async function render47(){
 const h=host47();if(!h)return;
 h.innerHTML='<div class="velora-sup47-card">Loading Unified Support Center…</div>';
 try{
  const r=await rpc47('velora_get_support_center',{});if(r.error)throw new Error(r.error.message||'Support center unavailable');
  const d=r.data||{},s=d.summary||{},cases=Array.isArray(d.cases)?d.cases:[];
  h.innerHTML=`<div class="velora-sup47">
   <div class="velora-sup47-toolbar"><div><b>Stage 47 — Unified Support & Case Center</b><div class="velora-sup47-muted">One operational case surface for order issues, payments, shipping, returns, disputes, account, fraud and technical support. Sensitive mutations remain governed by existing workflows.</div></div><div class="velora-sup47-actions"><button class="velora-sup47-btn primary" id="sup47New">＋ New Case</button><button class="velora-sup47-btn" id="sup47Refresh">↻ Refresh</button></div></div>
   <div class="velora-sup47-grid" style="margin-top:12px"><div class="velora-sup47-card"><div class="velora-sup47-muted">Total cases</div><div class="velora-sup47-big">${esc47(s.total||0)}</div></div><div class="velora-sup47-card"><div class="velora-sup47-muted">Open</div><div class="velora-sup47-big">${esc47(s.open||0)}</div></div><div class="velora-sup47-card"><div class="velora-sup47-muted">Critical</div><div class="velora-sup47-big">${esc47(s.critical||0)}</div></div><div class="velora-sup47-card"><div class="velora-sup47-muted">SLA overdue</div><div class="velora-sup47-big">${esc47(s.overdue||0)}</div></div></div>
   <div class="velora-sup47-card" style="margin-top:12px"><div class="velora-sup47-row"><strong>🧭 Unified case queue</strong><span class="velora-sup47-muted">Returns: ${esc47(s.unresolved_returns||0)} · Disputes: ${esc47(s.unresolved_disputes||0)}</span></div><div class="velora-sup47-list">${cases.length?cases.map(c=>`<div class="velora-sup47-case"><div class="velora-sup47-row"><div><strong>${esc47(c.case_key)}</strong><div class="velora-sup47-muted">${esc47(c.case_type)} · ${esc47(c.subject)}</div></div><div>${pill47(c.priority,c.priority==='critical'?'velora-sup47-danger':c.priority==='high'?'velora-sup47-warn':'')}</div></div><div class="velora-sup47-muted" style="margin-top:7px">Status: ${esc47(c.status)} · Owner: ${esc47(c.owner_role||'Unassigned')} · ${c.sla_overdue?'SLA OVERDUE':'SLA active'}</div><div class="velora-sup47-actions" style="margin-top:9px"><button class="velora-sup47-btn" data47-action="progress" data47-id="${esc47(c.id)}">Mark in progress</button><button class="velora-sup47-btn" data47-action="resolve" data47-id="${esc47(c.id)}">Resolve</button></div></div>`).join(''):'<div class="velora-sup47-muted">No support cases yet.</div>'}</div></div>
   <div class="velora-sup47-note"><b>Governance:</b> this center unifies support context; it does not bypass payment, refund, seller enforcement, returns/disputes, or security authorization boundaries.</div>
  </div>`;
  h.querySelector('#sup47Refresh')?.addEventListener('click',render47);
  h.querySelector('#sup47New')?.addEventListener('click',new47);
  h.querySelectorAll('[data47-action]').forEach(b=>b.addEventListener('click',()=>act47(b.dataset47Action,b.dataset47Id)));
 }catch(e){h.innerHTML='<div class="velora-sup47-card"><strong>Support center unavailable</strong><div class="velora-sup47-muted" style="margin-top:6px">'+esc47(e.message||e)+'</div></div>'}
}
async function new47(){
 const subject=prompt('Case subject:');if(!subject)return;
 const description=prompt('Brief description:')||'';
 const types=['support','order_issue','return','dispute','payment','shipping','product','account','fraud','technical'];
 const type=prompt('Case type (support/order_issue/return/dispute/payment/shipping/product/account/fraud/technical):','support')||'support';
 const priority=prompt('Priority (low/medium/high/critical):','medium')||'medium';
 try{const r=await rpc47('velora_create_support_case',{p_case_type:type,p_subject:subject,p_description:description,p_priority:priority,p_source_context:{surface:'support_center'}});if(r.error)throw new Error(r.error.message);alert('Created '+(r.data?.case_key||'support case'));render47()}catch(e){alert(e.message||'Could not create case')}
}
async function act47(action,id){
 try{const status=action==='resolve'?'resolved':'in_progress';const note=action==='resolve'?(prompt('Resolution note:')||'Resolved through support center'):null;const r=await rpc47('velora_update_support_case',{p_case_id:id,p_status:status,p_resolution:note});if(r.error)throw new Error(r.error.message);render47()}catch(e){alert(e.message||'Case update unavailable')}
}
function install47(){if(host47())return;const c=document.getElementById('adminContent');if(!c)return;const h=document.createElement('div');h.id='veloraSupport47';c.appendChild(h);render47()}
function addNav47(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-sup47-nav]'))return;const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Operations</div><div class="admin-nav-item" data-sup47-nav><span>🛟</span><span>Support & Cases</span></div>';const item=sec.querySelector('[data-sup47-nav]');item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const t=document.getElementById('adminHeaderTitle');if(t)t.textContent='Unified Support & Case Center';install47()};nav.appendChild(sec)}
setTimeout(addNav47,1800);setTimeout(install47,2300);window.VELORA_RENDER_SUPPORT47=render47;
console.log('✅ Velora Stage 47 Unified Support & Case Center loaded');
})();
