(function(){
'use strict';
function esc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));}
function root(){return document.querySelector('#adminPlatform .admin-main,.admin-main,#adminPlatform')||document.body}
async function rpc(name,args={}){if(!window.supabase)return null;const {data,error}=await window.supabase.rpc(name,args);if(error)throw error;return data}
function render(data){
 const c=document.getElementById('veloraAiRoot')||document.createElement('div');
 c.id='veloraAiRoot';
 const latest=(data&&data.latest_signals)||[];
 c.innerHTML=`<div class="velora-ai-toolbar"><div><b>Stage 28 — AI Decision Layer</b><div class="velora-ai-muted">AI-ready decision support built on canonical Velora signals. Recommendations are explainable and human-gated; this layer does not authorize payments, refunds, bans, or other sensitive mutations on its own.</div></div><div class="velora-ai-actions"><button class="btn btn-primary" onclick="window.VELORA_GENERATE_AI_SIGNALS()">✨ Generate signals</button><button class="btn" onclick="window.VELORA_RENDER_AI()">↻ Refresh</button></div></div>
 <div class="velora-ai-note">Human approval gate: <b>${esc(data&&data.awaiting_human_approval||0)}</b> proposed decisions currently require staff review before any execution state.</div>
 <div class="velora-ai-grid">
  <div class="velora-ai-card"><span class="velora-ai-label">Proposed</span><b>${esc(data&&data.proposed||0)}</b></div>
  <div class="velora-ai-card"><span class="velora-ai-label">High / Critical</span><b>${esc(data&&data.high_priority||0)}</b></div>
  <div class="velora-ai-card"><span class="velora-ai-label">Human Approval</span><b>${esc(data&&data.awaiting_human_approval||0)}</b></div>
  <div class="velora-ai-card"><span class="velora-ai-label">Executed</span><b>${esc(data&&data.executed||0)}</b></div>
 </div>
 <div class="card"><div class="card-title">Decision Signals</div><div style="overflow:auto"><table class="velora-ai-table"><thead><tr><th>Priority</th><th>Signal</th><th>Rationale</th><th>Recommendation</th><th>Confidence</th><th>Status</th><th>Action</th></tr></thead><tbody>${latest.length?latest.map(x=>`<tr><td><span class="velora-ai-pill">${esc(x.priority)}</span></td><td><b>${esc(x.title)}</b><div class="velora-ai-label">${esc(x.signal_code)}</div></td><td>${esc(x.rationale)}</td><td>${esc(x.recommendation)}</td><td>${x.confidence==null?'—':Math.round(Number(x.confidence)*100)+'%'}</td><td><span class="velora-ai-pill">${esc(x.status)}</span></td><td>${x.status==='proposed'?`<button class="btn btn-sm" onclick="window.VELORA_AI_DECIDE('${esc(x.id)}','approved')">Approve</button> <button class="btn btn-sm" onclick="window.VELORA_AI_DECIDE('${esc(x.id)}','rejected')">Reject</button>`:'—'}</td></tr>`).join(''):'<tr><td colspan="7">No decision signals yet.</td></tr>'}</tbody></table></div></div>
 <div class="card" style="margin-top:14px"><div class="card-title">AI Safety Contract</div><div class="velora-ai-muted">The AI layer may detect, prioritize, explain, and recommend. Sensitive actions remain behind existing Velora authorization, workflow, audit, and human approval controls. Model credentials, prompts, and provider secrets are never stored in this UI.</div></div>`;
 const r=root(); if(r&&c.parentElement!==r){r.appendChild(c)}
}
window.VELORA_RENDER_AI=async function(){try{const d=await rpc('velora_get_ai_decision_center');render(d||{});}catch(e){console.error(e);}};
window.VELORA_GENERATE_AI_SIGNALS=async function(){try{await rpc('velora_generate_ai_signals');await window.VELORA_RENDER_AI();}catch(e){alert(e.message||'AI signal generation failed');}};
window.VELORA_AI_DECIDE=async function(id,status){try{await rpc('velora_update_ai_decision',{p_signal_id:id,p_status:status});await window.VELORA_RENDER_AI();}catch(e){alert(e.message||'Decision update failed');}};
function addNav(){const nav=document.querySelector('#adminPlatform .admin-nav');if(!nav||nav.querySelector('[data-velora-ai-nav]'))return;const sec=document.createElement('div');sec.className='admin-nav-section';sec.innerHTML='<div class="admin-nav-title">Intelligence</div><div class="admin-nav-item" data-velora-ai-nav="1"><span>✨</span><span>AI Decision Layer</span></div>';const item=sec.querySelector('[data-velora-ai-nav]');item.onclick=()=>{document.querySelectorAll('.admin-nav-item').forEach(x=>x.classList.remove('active'));item.classList.add('active');const h=document.getElementById('adminHeaderTitle');if(h)h.textContent='AI Decision Layer';window.VELORA_RENDER_AI();};nav.appendChild(sec)}
const oldOpen=window.VELORA_OPEN_ADMIN;window.VELORA_OPEN_ADMIN=async function(){const r=oldOpen?await oldOpen():undefined;setTimeout(addNav,300);return r};setTimeout(addNav,1700);
console.log('✅ Velora Stage 28 AI Decision Layer loaded');
})();
